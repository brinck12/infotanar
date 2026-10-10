<?php

declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| Tanulasi celok es szobeli gyakorlas (WP7)
|--------------------------------------------------------------------------
| A routes/api.php tolti be, a `v1` csoporton belul: az utvonalak a /api/v1
| elotagot, az `api.` nevelotagot es a RejectInvalidToken middleware-t
| oroklik. A fajl sajat csoportot nyit, pl.:
|
|   Route::middleware('auth:sanctum')->group(...)
|
| Ide tartozik: /account/preferences es /oral/practice, /oral/practice/{topic}.
*/
