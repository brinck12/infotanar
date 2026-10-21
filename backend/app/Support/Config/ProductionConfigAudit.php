<?php

declare(strict_types=1);

namespace App\Support\Config;

use App\Services\Files\FileDisk;
use Illuminate\Support\Env;
use Illuminate\Support\Facades\Config;

/**
 * A betoltott konfiguracio ellenorzese eles uzem szempontjabol (#127).
 *
 * A szerver .env-je kezzel keszul, es a deploy nem irja felul. Egy hianyzo
 * kulcs enelkul csak az elso fizetesnel vagy az elso kikuldott levelnel
 * derulne ki. Minden szabaly a hozza tartozo .env valtozot nevezi meg.
 */
final class ProductionConfigAudit
{
    /** Levelezok, amelyek nem kezbesitenek valodi levelet. */
    private const NON_DELIVERING_MAILERS = ['log', 'array', 'outbox'];

    /** @return list<ConfigProblem> */
    public function problems(): array
    {
        return array_values(array_filter([
            ...$this->secretsAndDebug(),
            ...$this->urls(),
            ...$this->mail(),
            ...$this->billing(),
            ...$this->socialLogin(),
            ...$this->queue(),
            ...$this->redis(),
            ...$this->fileStorage(),
            ...$this->operations(),
            ...$this->documentedKeys(),
        ]));
    }

    /**
     * Uzemeltetesi alapok (OPS-3, OPS-11, OPS-12): arculat, naplozasi szint, a
     * "database" meghajto (a sor, a cache es a munkamenet is az adatbazist terheli),
     * futtato- es health-token, tokenlejarat.
     *
     * @return list<ConfigProblem|null>
     */
    private function operations(): array
    {
        $name = $this->text('app.name');
        $database = array_filter([
            'CACHE_STORE' => $this->text('cache.default'),
            'QUEUE_CONNECTION' => $this->text('queue.default'),
            'SESSION_DRIVER' => $this->text('session.driver'),
        ], static fn (string $driver): bool => $driver === 'database');

        return [
            $name === '' || $name === 'Laravel'
                ? new ConfigProblem('APP_NAME', 'Nincs megadva, vagy az alapértelmezett "Laravel": a levelek feladója és aláírása rossz nevet mutat.')
                : null,
            $this->text('logging.channels.daily.level') === 'debug'
                ? new ConfigProblem('LOG_LEVEL', '"debug" szint mellett a napló gyorsan megtelik, és személyes adat is kerülhet bele; éles üzemben "warning" vagy "info" elég.')
                : null,
            ...array_map(
                static fn (string $variable): ConfigProblem => new ConfigProblem($variable, 'Az adatbázis hajtja meg: terheli a fő adatbázist. Éles üzemben Redis ajánlott.'),
                array_keys($database),
            ),
            $this->required('judge0.auth_token', 'JUDGE0_AUTH_TOKEN', 'Nélküle a kódfuttató védtelen, vagy a futtatás elutasítja a kéréseket.'),
            Config::get('sanctum.expiration') === null
                ? new ConfigProblem('SANCTUM_EXPIRATION', 'Nincs megadva: az elveszett bejelentkezési token soha nem jár le.')
                : null,
            $this->required('health.token', 'HEALTH_TOKEN', 'Nélküle a részletes állapotjelentés csak adminként érhető el, a külső figyelő nem tud belépni.'),
        ];
    }

    /**
     * A .env.example "Eles kornyezet" blokkjaban felsorolt kulcsok mindegyikenek
     * szerepelnie kell a kornyezetben: a hianyzo kulcsrol kulonben csak a hasznalatakor derulne ki.
     *
     * @return list<ConfigProblem>
     */
    private function documentedKeys(): array
    {
        $path = base_path('.env.example');
        $content = is_file($path) ? file_get_contents($path) : false;
        $marker = '# Eles kornyezet';

        if ($content === false || ! str_contains($content, $marker)) {
            return [];
        }

        $block = substr($content, (int) strrpos($content, $marker));
        preg_match_all('/^#\s+\*?\s*([A-Z][A-Z0-9_]+)=/m', $block, $matches);

        $problems = [];
        foreach (array_unique($matches[1]) as $key) {
            if (Env::get($key) === null) {
                $problems[] = new ConfigProblem($key, 'Hiányzik a környezetből, pedig a .env.example éles blokkja felsorolja.');
            }
        }

        return $problems;
    }

    /**
     * Fajlfeladatok: a feltoltesek es a feladatfajlok privat taroloi irhatok
     * legyenek, es a zip-alapu formatumok (xlsx, docx, ods...) olvasasahoz
     * kell az ext-zip. Enelkul az elso feltoltes 500-as hibaval allna meg.
     *
     * @return list<ConfigProblem|null>
     */
    private function fileStorage(): array
    {
        return [
            extension_loaded('zip')
                ? null
                : new ConfigProblem('ext-zip', 'A PHP zip kiterjesztése nincs betöltve: a feltöltött fájlok (xlsx, docx, ods…) nem értékelhetők ki.'),
            $this->writableDisk(FileDisk::ExerciseFiles, 'EXERCISE_FILES_DISK'),
            $this->writableDisk(FileDisk::SubmissionFiles, 'SUBMISSION_FILES_DISK'),
        ];
    }

    /** Helyi tarolonal a gyoker (vagy a legkozelebbi letezo szuloje) legyen irhato; tavoli tarolot nem vizsgalunk. */
    private function writableDisk(FileDisk $disk, string $variable): ?ConfigProblem
    {
        $name = $disk->diskName();

        if ($this->text("filesystems.disks.{$name}.driver") === '') {
            return new ConfigProblem($variable, "A(z) \"{$name}\" tároló nincs definiálva (config/filesystems.php).");
        }

        $root = $this->text("filesystems.disks.{$name}.root");

        if ($this->text("filesystems.disks.{$name}.driver") !== 'local' || $root === '') {
            return null;
        }

        // A mappa az elso irasnal jon letre: addig a szulojenek kell irhatonak lennie.
        $existing = $root;
        while (! is_dir($existing) && dirname($existing) !== $existing) {
            $existing = dirname($existing);
        }

        return is_writable($existing)
            ? null
            : new ConfigProblem($variable, "A(z) \"{$name}\" tároló mappája nem írható ({$root}): a fájlok nem menthetők el.");
    }

    /** @return list<ConfigProblem|null> */
    private function secretsAndDebug(): array
    {
        return [
            Config::boolean('app.debug')
                ? new ConfigProblem('APP_DEBUG', 'Debug módban a hibaoldal kiírja a konfigurációt és a titkokat.', blocking: true)
                : null,
            $this->required('app.key', 'APP_KEY', 'Nélküle nincs titkosítás és aláírt link.', blocking: true),
        ];
    }

    /** @return list<ConfigProblem|null> */
    private function urls(): array
    {
        return [
            $this->publicHttpsUrl('app.url', 'APP_URL'),
            $this->publicHttpsUrl('app.frontend_url', 'FRONTEND_URL'),
        ];
    }

    /** @return list<ConfigProblem|null> */
    private function mail(): array
    {
        $mailer = $this->text('mail.default');
        $from = $this->text('mail.from.address');

        return [
            in_array($mailer, self::NON_DELIVERING_MAILERS, true)
                ? new ConfigProblem('MAIL_MAILER', "A(z) \"{$mailer}\" levelező nem kézbesít: a megerősítő és jelszó-visszaállító levelek nem érkeznek meg.")
                : null,
            $from === '' || str_ends_with($from, '@example.com')
                ? new ConfigProblem('MAIL_FROM_ADDRESS', 'Valódi feladó cím kell, a saját domainről.')
                : null,
            $this->required('alerts.email', 'ALERT_EMAIL', 'Nélküle az elbukott jobokról és az elakadt számlákról senki nem értesül.'),
        ];
    }

    /** @return list<ConfigProblem|null> */
    private function billing(): array
    {
        return [
            $this->required('billing.barion.pos_key', 'BARION_POS_KEY', 'Nélküle nem indítható fizetés.'),
            $this->required('billing.barion.payee', 'BARION_PAYEE', 'Nélküle nem indítható fizetés.'),
            $this->text('billing.barion.environment') !== 'prod'
                ? new ConfigProblem('BARION_ENVIRONMENT', 'A Barion tesztkörnyezete van beállítva: valódi fizetés nem történik.')
                : null,
            $this->required('billing.szamlazz.agent_key', 'SZAMLAZZ_AGENT_KEY', 'Nélküle a fizetésekről nem készül számla.'),
        ];
    }

    /**
     * Google-belepes: csak bekapcsolva ellenorzott. Az *_URL ertekek a teszt-stubhoz valok;
     * eles uzemben mas hostra mutatva barki hamis azonossaggal beleptethetne magat, ezert blokkolo.
     *
     * @return list<ConfigProblem|null>
     */
    private function socialLogin(): array
    {
        if (! Config::boolean('services.google.enabled')) {
            return [];
        }

        $endpoint = fn (string $key, string $variable, string $host): ?ConfigProblem => parse_url($this->text($key), PHP_URL_HOST) === $host && str_starts_with($this->text($key), 'https://')
            ? null
            : new ConfigProblem($variable, "Nem a Google ({$host}) HTTPS-címére mutat: a belépés hamisítható.", blocking: true);

        return [
            $this->required('services.google.client_id', 'GOOGLE_CLIENT_ID', 'Nélküle a Google-belépés ki van kapcsolva.'),
            $this->required('services.google.client_secret', 'GOOGLE_CLIENT_SECRET', 'Nélküle a Google-belépés ki van kapcsolva.'),
            $this->publicHttpsUrl('services.google.redirect', 'GOOGLE_REDIRECT_URI'),
            $endpoint('services.google.auth_url', 'GOOGLE_AUTH_URL', 'accounts.google.com'),
            $endpoint('services.google.token_url', 'GOOGLE_TOKEN_URL', 'www.googleapis.com'),
            $endpoint('services.google.userinfo_url', 'GOOGLE_USERINFO_URL', 'www.googleapis.com'),
        ];
    }

    /** @return list<ConfigProblem|null> */
    private function queue(): array
    {
        return [
            $this->text('queue.default') === 'sync'
                ? new ConfigProblem('QUEUE_CONNECTION', 'A "sync" sor a kérésen belül futtat mindent: a Barion callback kifuthat a határidejéből.')
                : null,
        ];
    }

    /**
     * OPS-9: eles terhelesnel a cache, a sor es a munkamenet Redisben van
     * (docs/runbooks/redis.md); az adatbazis-alapu valtozat csak figyelmeztetes.
     *
     * @return list<ConfigProblem|null>
     */
    private function redis(): array
    {
        $onDatabase = [
            'CACHE_STORE' => $this->text('cache.default'),
            'QUEUE_CONNECTION' => $this->text('queue.default'),
            'SESSION_DRIVER' => $this->text('session.driver'),
        ];
        $problems = [];

        foreach ($onDatabase as $variable => $value) {
            if ($value === 'database') {
                $problems[] = new ConfigProblem($variable, 'Adatbázis-alapú: terhelés alatt a cache-zárak és a sor sorai versenyeznek a MySQL-lel. Éles környezetben "redis" kell (docs/runbooks/redis.md).');
            }
        }

        $usesRedis = in_array('redis', $onDatabase, true);

        if ($usesRedis && $this->text('database.redis.default.password') === '') {
            $problems[] = new ConfigProblem('REDIS_PASSWORD', 'A Redis jelszó nélkül fut: a requirepass értékét kell megadni (docs/runbooks/redis.md).');
        }

        return $problems;
    }

    private function required(string $key, string $variable, string $consequence, bool $blocking = false): ?ConfigProblem
    {
        return $this->text($key) === ''
            ? new ConfigProblem($variable, "Nincs megadva. {$consequence}", $blocking)
            : null;
    }

    private function publicHttpsUrl(string $key, string $variable): ?ConfigProblem
    {
        $url = $this->text($key);
        $host = (string) parse_url($url, PHP_URL_HOST);

        return match (true) {
            in_array($host, ['', 'localhost', '127.0.0.1'], true) => new ConfigProblem($variable, "Helyi címre mutat ({$url}): a levelekben és a fizetési visszairányításban használhatatlan."),
            ! str_starts_with($url, 'https://') => new ConfigProblem($variable, "Nem HTTPS ({$url})."),
            default => null,
        };
    }

    private function text(string $key): string
    {
        $value = Config::get($key);

        return is_string($value) ? trim($value) : '';
    }
}
