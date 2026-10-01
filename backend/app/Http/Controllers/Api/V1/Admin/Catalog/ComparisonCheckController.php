<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin\Catalog;

use App\Actions\Admin\Catalog\CheckOutputComparison;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\Catalog\ComparisonCheckRequest;
use App\Http\Resources\Admin\ComparisonCheckResource;

/** "Kiprobalom" a feladat-szerkesztoben (#155): megmutatja, egyezne-e a ket kimenet a megadott beallitasokkal. */
final class ComparisonCheckController extends Controller
{
    public function __invoke(ComparisonCheckRequest $request, CheckOutputComparison $check): ComparisonCheckResource
    {
        return ComparisonCheckResource::make($check->handle($request->settings(), $request->actual(), $request->expected()));
    }
}
