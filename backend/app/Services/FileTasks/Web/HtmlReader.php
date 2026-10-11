<?php

declare(strict_types=1);

namespace App\Services\FileTasks\Web;

use App\Services\Files\PrivateFileStore;
use App\Services\Files\StoredFile;
use App\Services\Files\UploadedFileInspector;
use App\Services\Files\XmlSafety;
use App\Services\FileTasks\FileReader;
use App\Services\FileTasks\OpenedFile;
use App\Services\FileTasks\Presentation\Xp;
use App\Services\FileTasks\UnreadableFile;
use Illuminate\Contracts\Filesystem\FileNotFoundException;
use LengthException;

/**
 * A html es css fajlok olvasoja. A HTML-t az XmlSafety::loadHtml tolti be
 * (nincs halozat), a <style> elemek szabalyait a CssParser olvassa. A fajlt
 * nem futtatjuk, nem jelenitjuk meg, a benne talalt cimeket nem toltjuk le.
 */
final readonly class HtmlReader implements FileReader
{
    public function __construct(
        private PrivateFileStore $files,
        private CssParser $css,
    ) {}

    /** @return list<string> */
    public function extensions(): array
    {
        return ['.html', '.css'];
    }

    public function open(StoredFile $file): OpenedFile
    {
        try {
            $text = $this->files->bytes($file, UploadedFileInspector::maxBytesFor('text'));
        } catch (FileNotFoundException|LengthException $exception) {
            throw new UnreadableFile('A fajl nem olvashato.', $exception);
        }

        $text = str_starts_with($text, "\xEF\xBB\xBF") ? substr($text, 3) : $text;

        if (str_contains($text, "\0")) {
            throw new UnreadableFile('A fajl nem szoveg.');
        }

        if (! mb_check_encoding($text, 'UTF-8')) {
            // A magyar iskolai gepeken gyakori a Windows-1250 kodolas.
            $text = mb_convert_encoding($text, 'UTF-8', 'Windows-1250');
        }

        if ($file->extension === '.css') {
            return new WebModel(null, $this->css->parse($text));
        }

        $document = XmlSafety::loadHtml($text);
        $xp = Xp::for($document, []);
        $rules = [];

        foreach ($xp->elements('//style') as $style) {
            $media = trim($style->getAttribute('media'));
            $parsed = $this->css->parse($style->textContent);

            foreach ($parsed as $rule) {
                $rules[] = $media === '' || strtolower($media) === 'all' || strtolower($media) === 'screen'
                    ? $rule
                    : new CssRule($rule->selector, $rule->declarations, $rule->media ?? $media);
            }
        }

        return new WebModel($document, $rules, $xp);
    }
}
