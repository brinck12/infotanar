<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\FileSubmissionStatus;
use App\Services\Files\FileDisk;
use App\Services\Files\StoredFile;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Egy feltoltott fajl es az ertekelese. Gyakorlo fajlfeladatnal es
 * vizsgaresznel is ez a sor keletkezik.
 *
 * Vizsgasor (`exam_attempt_id` kitoltve): kimarad a gyakorlo listakbol es a
 * haladasbol, es a vizsga beadasaig `stored` allapotban var.
 *
 * A `result` pillanatkep: a regi eredmeny az ertekelolap kesobbi valtozasa
 * vagy egy pont torlese utan is olvashato marad. Alakja:
 *
 *   groups: [{name, score, max_score}]            a csoportok az ertekelolap sorrendjeben
 *   items:  [{rubric_item_id, group, label,
 *             state (App\Enums\RubricState),
 *             points, max_points, found, hint,
 *             manual_mark (bool|null)}]
 *   facts:  [{label, value}]                      amit az olvaso a fajlban talalt
 *
 * @property int $id
 * @property int|null $user_id NULL csak vedohalo; a fiok torlesekor a sor is torlodik.
 * @property int $exercise_id
 * @property int|null $exam_attempt_id
 * @property int|null $exam_part_id
 * @property int $attempt Gyakorlasnal futo sorszam felhasznalonkent es feladatonkent; vizsgasornal 1.
 * @property FileSubmissionStatus $status
 * @property string $original_name Megtisztitott megjelenitesi nev.
 * @property string $path Relativ utvonal a `submission_files` tarolon.
 * @property string $extension Kisbetus, ponttal (pl. ".xlsx").
 * @property int $size Meret byte-ban.
 * @property string $sha256
 * @property int $score Nyers pont: automatikus pontok + megjelolt kezi pontok.
 * @property int $max_score Az ertekelolap osszpontszama az ertekeles pillanataban.
 * @property bool $passed Megoldottnak szamit-e (filetasks.pass_ratio).
 * @property array{groups: list<array<string, mixed>>, items: list<array<string, mixed>>, facts: list<array<string, mixed>>}|null $result
 * @property string|null $error Magyar ok, ha a feldolgozas nem sikerult.
 * @property CarbonImmutable|Carbon|null $evaluated_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $user
 * @property-read Exercise $exercise
 * @property-read ExamAttempt|null $examAttempt
 * @property-read ExamPart|null $examPart
 */
final class FileSubmission extends Model
{
    protected $fillable = [
        'user_id', 'exercise_id', 'exam_attempt_id', 'exam_part_id', 'attempt', 'status',
        'original_name', 'path', 'extension', 'size', 'sha256',
        'score', 'max_score', 'passed', 'result', 'error', 'evaluated_at',
    ];

    /** @var array<string, mixed> */
    protected $attributes = [
        'attempt' => 1,
        'status' => 'stored',
        'score' => 0,
        'max_score' => 0,
        'passed' => false,
    ];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'status' => FileSubmissionStatus::class,
            'attempt' => 'integer',
            'size' => 'integer',
            'score' => 'integer',
            'max_score' => 'integer',
            'passed' => 'boolean',
            'result' => 'array',
            'evaluated_at' => 'datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** @return BelongsTo<Exercise, $this> */
    public function exercise(): BelongsTo
    {
        return $this->belongsTo(Exercise::class);
    }

    /** @return BelongsTo<ExamAttempt, $this> */
    public function examAttempt(): BelongsTo
    {
        return $this->belongsTo(ExamAttempt::class);
    }

    /** @return BelongsTo<ExamPart, $this> */
    public function examPart(): BelongsTo
    {
        return $this->belongsTo(ExamPart::class);
    }

    /**
     * Gyakorlo beadasok: nem vizsgaban keletkeztek. Csak ezek szamitanak a
     * listakba es a haladasba.
     *
     * @param  Builder<FileSubmission>  $query
     */
    #[Scope]
    protected function practice(Builder $query): void
    {
        $query->whereNull('exam_attempt_id');
    }

    public function isPractice(): bool
    {
        return $this->exam_attempt_id === null;
    }

    /** A tarolt fajl leiroja a PrivateFileStore es az olvasok szamara. */
    public function storedFile(): StoredFile
    {
        return new StoredFile(
            FileDisk::SubmissionFiles,
            $this->path,
            $this->original_name,
            $this->extension,
            $this->size,
            $this->sha256,
        );
    }
}
