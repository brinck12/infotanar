<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Enums\RequiredConstruct;
use App\Http\Controllers\Controller;
use App\Services\Constraints\Prohibition;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Config;

/**
 * A feladat-szerkeszto (#49) valaszthato szabalyai, magyar cimkekkel, hogy
 * a kliens ne kodolja be oket es ne nyers JSON-t kelljen gepelni. A
 * beallitas az admin feladat-vegpontokon (constraints mezo) tortenik.
 */
final class ConstraintOptionsController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $forbid = [];
        foreach ([Prohibition::BUILTIN, Prohibition::METHOD] as $kind) {
            foreach (Config::array("constraints.suggested_forbid.{$kind}") as $name) {
                if (is_string($name)) {
                    $prohibition = Prohibition::parse("{$kind}:{$name}");
                    $forbid[] = ['value' => $prohibition->key(), 'kind' => $kind, 'label' => $prohibition->describe()];
                }
            }
        }

        return response()->json(['data' => [
            'require' => array_map(
                static fn (RequiredConstruct $construct): array => ['value' => $construct->value, 'label' => $construct->describe()],
                RequiredConstruct::cases(),
            ),
            'forbid' => $forbid,
            // Az elemzes jelenleg csak ezekre a nyelvekre fut (C#: #86).
            'enforced_languages' => ['python'],
            'format' => ['forbid' => 'builtin:<név> | method:<név>'],
        ]]);
    }
}
