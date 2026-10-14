# Backend kod-audit (ugynok jelentes, tomoritve)

47 talalat: 0 blokkolo, 14 fontos, 22 kellemetlen, 11 otlet. Spot-check, nem teljes. docs:endpoints zold; nincs Larastan suppress, nincs stub/TODO az app/-ban. Feltoltes, zip, xml, rejtett teszteset kezeles stabil. Pozitivak: vizsga start/submit/upload zarral es unique-index fallbackkel; redactor allow-list; fiok-torles anonimizalasa alapos; migraciok MySQL-tudatosak down()-nal (haromnak nincs, dokumentalt); admin middleware a binding elott.

Fontos
- B01 | FileTasks/SubmitFileSolution.php:167 | a megorzes (10 beadas/feladat) nem tartja meg a sikeres beadast, a "megoldva" allapot es a lecke-haladas a file_submissions-bol szarmazik (ExerciseAttempts.php:36) -> a diak megoldott feladata visszaesik; ugyanez a 365 napos megorzesi job | a legjobb/sikeres beadast megtartani, vagy solved_at jelzo
- B02 | routes/api.php:119,127,144,150,163,216; routes/api/file-tasks.php:48 | a nevtelen throttle:N,M limiterek egy szamlalot osztanak felhasznalonkent (vendegnel IP-nkent): 11 lecke-teljesites blokkolja a PATCH /account/profile-t; /client-errors, /health/ready, /webhooks/barion egy vendeg-IP szamlalon | 3. parameter vagy nevesitett limiter
- B03 | routes/api.php:59 | a register nem limitalt es barmely cimre levelet kuld | register limiter
- B04 | AppServiceProvider.php:160-170 | login es jelszo-visszaallitas csak email+IP szerint limitalt | kulon email-only es IP-only limit
- B05 | Actions/Account/DeleteAccount.php:61, Listeners/* | 5 AccountDeleted listener szinkron; egy hiba megall, nincs ujraproba; a takaritas kihagyja a lessonCompletions-t es accessGrants-ot | queue afterCommit, takaritas bovitese
- B06 | Admin/Access/GrantPremiumAccess.php:33 | az audit metadata orokre megtartja a szabad szoveges indoklast; audit_logs/consents ip es user_agent megorzes/anonimizalas nelkul | indoklas ki a metadatabol, megorzesi job
- B07 | Services/Judge0Service.php:137 | sikertelen /languages hivas 3600 s-ra [] -t cache-el, egy oraig fallback ID-k | hibat ne cache-elni
- B09 | deploy/systemd/infotanar-queue.service:18, CloseExpiredExamAttempts | egyetlen queue worker (60 s timeout, retry_after 90) szolgal ki leveleket, percenkenti vizsgaseprest, szamlazast, heartbeat-et | kulon queue-k, 2+ worker, timeout < retry_after
- S01 | bootstrap/app.php | nincs trustProxies: CDN/proxy mogott minden vendeg egy IP | trustProxies env-bol + check-config
- F01 | egesz backend | hianyzik: kereses, tipp/megoldas felfedes, feladat-statisztika, sorozat/napi cel, emlekezteto/ertesites, kozlemeny, kapcsolat/visszajelzes/hibas feladat jelentes | tipp, sorozat/cel, kapcsolat, kereses prioritas
- F02 | users, RegisterRequest | nincs eletkor/szuloi hozzajarulas kezeles, kiskorukat celzo platformon (GDPR 16 ev alatt) | eletkor mezo es hozzajarulasi folyamat (jogi egyeztetes)

Kellemetlen
- B08 Execution/SubmitSolution.php:39 | 'running' sor tranzakcio/finally nelkul, kemeny hibanal orokre 'running' | hiba-allapot vagy seprő
- B10 Models/Exercise.php:166, TaskController, LessonVideoController, RunCodeRequest | a published scope nem nezi a track.is_published-et; piszkozat agak leckei elerhetok /tasks/{id}, video, /run, /submissions utan | kozos "diak altal lathato" scope
- B11 RunCodeRequest.php:24 | exists:exercises,id: hianyzo id 422, nem publikalt 404 -> piszkozat-id kiszivarog | exists szabaly el
- B12 SubmitSolution.php:35 | vendeg beadasok (user_id null, 64 KB-ig) sosem torlodnek | megorzes user_id IS NULL-ra
- B13 RegisterRequest.php:20, IssueAccessToken.php:19 | unique:users,email felfedi a regisztralt cimeket; ismeretlen felhasznalonal a jelszo-hash ellenorzes kimarad (idozites) | tudatos dontes, dummy Hash::check
- B14 RegisterRequest.php:24-26, RecordConsent.php | terms_version/privacy_version kliens-string, nincs ellenorizve; nincs ujraelfogadas | szerver oldali verzio + Rule::in
- B15 GrantAccessRequest.php:31 | csak datum ends_at UTC-ben ertelmezve, az utolso nap elveszik | nap vege Europe/Budapest
- B16 AppServiceProvider.php:44-60 | string class_exists kotes NullExamResultRecalculator fallbackkel; atnevezes eseten csendben nem szamol ujra a kezi pont | RecomputeExamResult kozvetlen kotese, Null torlese
- B17 CloseExpiredExamAttempts GAVE_UP_KEY, console.php:45 | feladott lista orok cache-ben read-modify-write; cache:clear ujra riaszt; withoutOverlapping sorbaallitott jobon hatastalan | DB oszlop, withoutOverlapping el
- B18 Admin/Catalog/LessonController.php:60-68 | torles-vedelem tranzakcio nelkul (TOCTOU), egyideju diak-teljesites elveszhet | tranzakcio + zar
- S02 ProductionConfigAudit.php:84-136 | app:check-config nem nezi: DB driver, CACHE_STORE, SANCTUM_EXPIRATION, JUDGE0 token, LOG_LEVEL=debug (a .env.example alapja), CORS localhost | bovitni
- S03 nginx security-headers.conf:22 | a frontend CSP csak Report-Only | ervenyesiteni
- S04 routes/api.php:165-222 | admin destruktiv/export vegpontok nincsenek limitalva, nincs jelszo-megerosites | admin-sensitive limiter
- S06 LessonVideoController.php:34-66 | az alairt video URL nem felhasznalohoz kotott (elfogadott kompromisszum)
- K01 DeleteAccount.php:43 'Torolt felhasznalo' PHP-ban fixen; Services/Health/Checks/*, UnreadableFile uzenetek (DocumentReader.php:46, DocxParser.php:71,86,115, OdtParser.php:90,138,242,341), ConstraintSet.php:47,53,101,107, Prohibition.php:28, ConstraintOptionsController.php:41 | a diakhoz elero uzenetek lang/hu-ba
- K05 UpdatePreferencesRequest.php:22 | level ertekek fixen, a tobbi config/learning-bol
- K06 console.php:45 | withoutOverlapping queue jobon hatastalan; ShouldBeUnique kell
- F03 AuditAction.php | nincs audit: belepes/sikertelen belepes, jelszo-visszaallitas, kezi pontozas, vizsga ertekeles
- F04 app/Notifications | jelszocsere ertesites hianyzik (csak e-mail csere)

Otlet
- B19 SaveManualMarks | a diak maga pontozza a kezi tetelt es ez szamit sikerhez/leckehez/vizsgapontba (dokumentalt dontes) | kulon "onertekelt" allapot
- B20 Subscription.php:92 | torleskor a Barion token nem vonodik vissza (szamlazas, kesobb)
- S05 sanctum | 30 napos tokenek, nincs lathato munkamenet-lista | GET/DELETE /account/tokens
- S07 ClientErrorController | vendeg-iras log, sortores-injekcio | sortoresek eltavolitasa
- K02 | tasks vs exercises, topics=modules; harom lista-forma (paginate, cursorPaginate, csupasz {data}); /tasks, /exams, /tracks, admin listak nem lapozottak | egy boritek/lapozas, verziozas
- K03 | OdtParser 802, DocxParser 749, XlsxParser 673 sor | kozos reteg
- F05 | nincs audit-log bongeszo, admin nezet a diak beadasairol, feladatstatisztika, piszkozat-elonezet, tomeges muveletek
- F06 ExportAccountData.php | az export mindent memoriaba tolt | chunk/stream/queue
- F07 TaskController, ExamController, TrackController | publikus listak cache/limit nelkul
