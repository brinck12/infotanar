<?php

declare(strict_types=1);

namespace App\Support\Config;

use App\Services\Files\FileDisk;
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
            ...$this->queue(),
            ...$this->fileStorage(),
        ]));
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

    /** @return list<ConfigProblem|null> */
    private function queue(): array
    {
        return [
            $this->text('queue.default') === 'sync'
                ? new ConfigProblem('QUEUE_CONNECTION', 'A "sync" sor a kérésen belül futtat mindent: a Barion callback kifuthat a határidejéből.')
                : null,
        ];
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
