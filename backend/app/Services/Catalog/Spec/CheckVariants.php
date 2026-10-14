<?php

declare(strict_types=1);

namespace App\Services\Catalog\Spec;

/**
 * Egy bongeszos feladat ellenorzeseinek (checks) tipusai. A frontend unio
 * tipusainak (WebCheck, a SheetPracticeInfo es a DocPracticeInfo `checks`
 * elemei) szerveroldali parja: minden tipusnak megvannak a sajat mezoi, es
 * egy ellenorzes pontosan a tipusa mezoit hordozhatja.
 *
 * A szabalyok a bekuldott adatbol, konkret indexekkel keszulnek (pl.
 * `checks.2.value`), mert ugyanaz a mezonev tipusonkent mast jelenthet (a
 * `value` igazitasnal szoveg, betumeretnel szam).
 */
final readonly class CheckVariants
{
    /**
     * @param  list<string>  $common  minden ellenorzesben megengedett kulcsok (pl. id, label, type)
     * @param  array<string, array<string, CheckField>>  $variants  tipus => mezonev => mezo
     */
    public function __construct(
        private array $common,
        private array $variants,
    ) {}

    /** @return list<string> */
    public function types(): array
    {
        return array_keys($this->variants);
    }

    /**
     * Elemenkent: a megengedett kulcsok es a tipus sajat mezoinek szabalyai.
     * A kozos mezok (`label`, `type`...) szabalyait a hivo adja meg helyettesitovel.
     *
     * @param  string  $path  a lista utvonala a `spec`-en belul, pl. "checks"
     * @return array<string, list<mixed>>
     */
    public function rules(string $path, mixed $checks): array
    {
        $rules = [];

        foreach (SpecValue::items($checks) as $index => $check) {
            $fields = $this->fieldsOf($check);
            $rules["{$path}.{$index}"] = ['array', new KnownKeys([...$this->common, ...array_keys($fields)])];

            foreach ($fields as $name => $field) {
                $rules["{$path}.{$index}.{$name}"] = $field->rules();
            }
        }

        return $rules;
    }

    /**
     * Az ellenorzes tipusa es a tipus sajat mezoi, vegleges tipusra allitva; a
     * meg nem adott elhagyhato mezok kimaradnak.
     *
     * @return array<string, string|int|float>
     */
    public function values(mixed $check): array
    {
        $check = SpecValue::map($check);
        $values = ['type' => SpecValue::string($check['type'] ?? null)];

        foreach ($this->fieldsOf($check) as $name => $field) {
            $value = $field->cast($check[$name] ?? null);

            if ($value !== null) {
                $values[$name] = $value;
            }
        }

        return $values;
    }

    /**
     * Ismeretlen vagy hianyzo tipusnal nincs sajat mezo: a `type` szabalya jelzi a hibat.
     *
     * @return array<string, CheckField>
     */
    private function fieldsOf(mixed $check): array
    {
        $type = SpecValue::map($check)['type'] ?? null;

        return is_string($type) ? $this->variants[$type] ?? [] : [];
    }
}
