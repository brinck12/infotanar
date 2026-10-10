<?php

declare(strict_types=1);

namespace App\Enums;

/**
 * Egy csatolt fajl szerepe (`attachments.role`).
 *
 * A szerep donti el, ki lathatja a fajlt: a `source`, a `sample_image` es a
 * `source_zip` a diaknak szol (alairt URL-en at), az `input` es a
 * `sample_solution` soha nem megy ki diaknak.
 */
enum AttachmentRole: string
{
    /** Forrasfajl: a diak letoltheti; kod- es SQL-feladatnal a Judge0 is megkapja. */
    case Source = 'source';

    /** Egy teszteset sajat (rejtett) bemeneti fajlja: az azonos nevu kozos forrasfajl helyere lep. */
    case Input = 'input';

    /** A fajlfeladat "Minta" kepe. */
    case SampleImage = 'sample_image';

    /** Hibatlan mintamegoldas az ertekelolap kiprobalasahoz; csak adminnak. */
    case SampleSolution = 'sample_solution';

    /** Vizsga: az osszes forrasfajl egy zipben. */
    case SourceZip = 'source_zip';

    /** A diaknak szolo eroforrasokban megjelenhet-e (alairt letoltesi URL-lel). */
    public function isStudentVisible(): bool
    {
        return in_array($this, [self::Source, self::SampleImage, self::SourceZip], true);
    }

    /** Csak az admin alairt URL-jevel toltheto le; a diak-URL 404-et kap. */
    public function isAdminOnly(): bool
    {
        return ! $this->isStudentVisible();
    }

    /** Kotelezo-e hozza teszteset (`test_case_id`). */
    public function requiresTestCase(): bool
    {
        return $this === self::Input;
    }

    /** A nevre a szigoru, Judge0-biztos minta vonatkozik-e (3.3: source es input). */
    public function hasStrictName(): bool
    {
        return in_array($this, [self::Source, self::Input], true);
    }

    /** Tulajdonosonkent legfeljebb egy lehet belole: az uj feltoltes a regit csereli. */
    public function isSingleton(): bool
    {
        return in_array($this, [self::SampleImage, self::SampleSolution, self::SourceZip], true);
    }

    /**
     * Feladathoz csatolhato szerepek (a vizsga csak `source_zip`-et kap).
     *
     * @return list<self>
     */
    public static function forExercises(): array
    {
        return [self::Source, self::Input, self::SampleImage, self::SampleSolution];
    }
}
