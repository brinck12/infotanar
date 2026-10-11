<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Presentation;

use App\Services\Files\XmlSafety;
use App\Services\Files\ZipSafety;
use App\Services\FileTasks\UnreadableFile;
use DOMDocument;
use DOMXPath;
use ZipArchive;

/**
 * Egy megnyitott OOXML csomag memoriaban: a reszeket a ZipSafety korlatjaval
 * olvassa, az XmlSafety-n at tolti be (DOCTYPE nelkul), es egy beolvasason
 * belul gyorsitotarazza. Lemezre semmit nem csomagol ki.
 */
final class OoxmlPackage
{
    public const NS_RELATIONSHIPS = 'http://schemas.openxmlformats.org/package/2006/relationships';

    /** A beolvasott reszek legfeljebb ennyi darabja tarolodik egy csomagnal. */
    private const MAX_PARTS = 3000;

    /** Az osszes beolvasott XML-resz osszmerete (byte); ennel tobbet egy csomagbol nem olvasunk. */
    private const MAX_TOTAL_BYTES = 32 * 1024 * 1024;

    /** @var array<string, DOMDocument|null> */
    private array $documents = [];

    private int $bytesRead = 0;

    public function __construct(
        private readonly ZipArchive $zip,
        private readonly ZipSafety $zips,
    ) {}

    /**
     * A resz XML-je; null, ha a csomagban nincs ilyen resz.
     *
     * A $cache hamis erteknel a DOM nem marad meg a csomagban: a dia-reszeket
     * egyszer olvassuk, es a libxml memoriaja (a PHP memory_limit-en kivul)
     * a XML merete tobbszorose, ezert egyszerre csak egy dia lehet a memoriaban.
     */
    public function document(string $path, bool $cache = true): ?DOMDocument
    {
        if ($cache && array_key_exists($path, $this->documents)) {
            return $this->documents[$path];
        }

        if ($cache && count($this->documents) >= self::MAX_PARTS) {
            throw new UnreadableFile('Tul sok resz a csomagban.');
        }

        $xml = $this->zips->read($this->zip, $path);

        if ($xml === null) {
            return $cache ? $this->documents[$path] = null : null;
        }

        $this->bytesRead += strlen($xml);

        if ($this->bytesRead > self::MAX_TOTAL_BYTES) {
            throw new UnreadableFile('A csomag XML-reszei egyutt tul nagyok.');
        }

        $document = XmlSafety::load($xml);

        return $cache ? $this->documents[$path] = $document : $document;
    }

    public function exists(string $path): bool
    {
        return $this->zip->locateName($path) !== false;
    }

    /**
     * Egy resz kapcsolatai: azonosito => a cel teljes utvonala a csomagban
     * (kulso celokat kihagyja).
     *
     * @return array<string, array{path: string, type: string}>
     */
    public function relationships(string $partPath): array
    {
        $directory = dirname($partPath);
        $relsPath = ($directory === '.' ? '' : $directory.'/').'_rels/'.basename($partPath).'.rels';
        $document = $this->document($relsPath, false);

        if ($document === null) {
            return [];
        }

        $found = [];

        foreach ($document->getElementsByTagNameNS(self::NS_RELATIONSHIPS, 'Relationship') as $relationship) {
            if ($relationship->getAttribute('TargetMode') === 'External') {
                continue;
            }

            $id = $relationship->getAttribute('Id');
            $target = $relationship->getAttribute('Target');

            if ($id === '' || $target === '') {
                continue;
            }

            $found[$id] = [
                'path' => self::resolve($directory, $target),
                'type' => $relationship->getAttribute('Type'),
            ];
        }

        return $found;
    }

    /** Az elso kapcsolat cel-utvonala, amelynek tipusa a megadott vegzodesu; null, ha nincs. */
    public function relatedPart(string $partPath, string $typeSuffix): ?string
    {
        foreach ($this->relationships($partPath) as $relationship) {
            if (str_ends_with($relationship['type'], $typeSuffix)) {
                return $relationship['path'];
            }
        }

        return null;
    }

    /**
     * @param  array<string, string>  $namespaces  elotag => nevter
     */
    public static function xpath(DOMDocument $document, array $namespaces): DOMXPath
    {
        $xpath = new DOMXPath($document);

        foreach ($namespaces as $prefix => $uri) {
            $xpath->registerNamespace($prefix, $uri);
        }

        return $xpath;
    }

    private static function resolve(string $directory, string $target): string
    {
        $path = str_starts_with($target, '/') ? ltrim($target, '/') : ($directory === '.' ? '' : $directory.'/').$target;
        $segments = [];

        foreach (explode('/', $path) as $segment) {
            if ($segment === '..') {
                array_pop($segments);
            } elseif ($segment !== '' && $segment !== '.') {
                $segments[] = $segment;
            }
        }

        return implode('/', $segments);
    }
}
