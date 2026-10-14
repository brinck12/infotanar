# Backend platform: haladasi naplo

Sajat hasznalatra: a `BACKEND.md` (terv) allapotanak koveteese az `fullstack/backend-platform` agon. Frissitsd, amikor valami valtozik.

Frissitve: 2026-10-14

## Munkacsomagok (BACKEND.md 7. fejezet)

Merge-ek ellenorizve a `git log --merges` alapjan; a "gap" oszlop az audit eredmenye (lasd lent).

| WP | Tartalom | Merge | Gap |
|---|---|---|---|
| 0 | Alapok (migraciok, modellek, szolgaltatasok, config) | igen | nincs |
| 1 | Tipusos feladatok, mellekletek | igen (430de69) | nincs |
| 2 | Kodfuttatas: input fajlok, osszehasonlitas, reszfeladatok | igen (3a1f890) | nincs |
| 3 | Fajlbeadasok, rubrika admin, tablazat-ellenorzes | igen (122141b) | nincs |
| 4 | Dokumentum-ellenorzes (docx, odt) | igen (1706567) | nincs |
| 5 | Dia/vektor/web/kep ellenorzes | igen (e4928a9) | nincs |
| 6 | Vizsgak | igen (aeafbaa) | nincs |
| 7 | Beallitasok, szobeli gyakorlas | igen (7ee567d) | nincs |
| 8 | Haladas, export, torles, megorzes | igen (26f07e8) | nincs |
| 9 | Admin attekintes | igen (6855606) | nincs |
| 10 | Frontend integracio | igen (e0991d5) | kivul esik (csak backend) |
| 11 | Admin szerkeszto UI | igen (5431ebd) | kivul esik (csak backend) |

`integration-fixes` agon nincs olyan commit, ami ne lenne az integracios agon.

## Kapuk (2026-10-14, integracios ag)

- `composer lint`: zold
- `composer analyse`: zold (max szint)
- `docs:endpoints --check`: zold
- frontend lint/typecheck/build: zold (nem backend, csak tajekoztato)
- `npm run test:api` (api + api-rate-limit): 289 teszt zold, 6.9 perc

## Kornyezeti jegyzet

A PHP-hoz `PHPRC` kell egy olyan php.ini-re, amiben `zip` es `intl` be van kapcsolva. Keszites: `C:/xampp/php/php.ini` masolata, a `;extension=zip` es `;extension=intl` sorok kikommentezese. A masolat a session scratchpad `php/` mappajaban van, nem tartos.

## Audit eredmeny (2026-10-14, statikus olvasas)

Nincs blokkolo hiany egyik csomagban sem. Apro eltérések:
- WP5: a html/css esetek a `filetasks:evaluate` CLI-n futnak, nem a `rubric-check` vegponton (a tobbi tipus igen).
- WP4: `checks-documents.spec.ts` tablazat-vezerelt, a tulajdonsagonkenti pozitiv/negativ lefedettseg kezzel nem ellenorzott.
- WP3: a "kezi pont -> lecke teljesites" eset a `progress-privacy.spec.ts`-ben van, nem a `file-submissions.spec.ts`-ben.
- WP7: lezarva, nem hiba. `checked` indexei 0..29 (`between:0,29`, max 30 elem); a terv "30 -> 422" szovege a 30-as indexre vonatkozik.

## Hatra van

1. Merge `main`-be es push: a harness letiltotta (production deploy), a felhasznalo dontsek. Az integracios ag kesz, ccff65c a teteje.
2. MySQL ellenorzes: a CI MySQL job fedi, push utan nezendo.
3. Takarítas: ~12 regi worktree/ag (mind merge-elt, 0 egyedi commit), `.claude/` untracked.
4. `docs/runbooks/go-live.md` operacios tetelei (szerver, SMTP, Barion, Szamlazz.hu, jogi szovegek).

## Naplo

- 2026-10-14: allapotfelmeres, kapuk, ket audit, API tesztek 289/289; negy apro teszt lezarva (+6, 295); tests/testplan.md megirva.
