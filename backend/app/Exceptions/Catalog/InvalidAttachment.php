<?php

declare(strict_types=1);

namespace App\Exceptions\Catalog;

use App\Exceptions\DomainException;

/**
 * A csatolmany nem felel meg a szerepere ervenyes szabalyoknak (nev,
 * teszteset, tulajdonos). A ManageAttachment dobja; a hibat ahhoz a mezohoz
 * koti, amelyet az admin urlapon javitani kell.
 */
final class InvalidAttachment extends DomainException
{
    private function __construct(string $message, private readonly string $field)
    {
        parent::__construct($message);
    }

    /** A forras- es bemeneti fajlok neve csak betu, szam, pont, kotojel es alahuzas lehet. */
    public static function name(): self
    {
        return new self(__('filetasks.attachment_name_invalid'), 'name');
    }

    /** A nev a Judge0 sajat fajlneve lenne (script.py, Main.cs...). */
    public static function reservedName(string $name): self
    {
        return new self(__('filetasks.attachment_name_reserved', ['name' => $name]), 'name');
    }

    /** A nev nem fer el az `attachments.name` oszlopban. */
    public static function nameTooLong(): self
    {
        return new self(__('filetasks.attachment_name_too_long'), 'name');
    }

    /** A megadott nev kiterjesztese mas, mint a feltoltott (es ellenorzott) fajle. */
    public static function extensionMismatch(string $extension): self
    {
        return new self(__('filetasks.attachment_extension_mismatch', ['ext' => $extension]), 'name');
    }

    /** `input` szerephez kotelezo a teszteset. */
    public static function testCaseRequired(): self
    {
        return new self(__('filetasks.attachment_test_case_required'), 'test_case_id');
    }

    /** A teszteset nem ehhez a feladathoz tartozik, vagy a szerephez nem adhato meg. */
    public static function testCaseNotAllowed(): self
    {
        return new self(__('filetasks.attachment_test_case_not_allowed'), 'test_case_id');
    }

    /** A szerep ennel a tulajdonosnal (feladatfajta vagy vizsga) nem hasznalhato. */
    public static function roleNotAllowed(): self
    {
        return new self(__('filetasks.attachment_role_not_allowed'), 'role');
    }

    public function status(): int
    {
        return 422;
    }

    public function errors(): array
    {
        return [$this->field => [$this->getMessage()]];
    }
}
