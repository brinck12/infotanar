# Frontend kod- es IA-audit (ugynok jelentes, tomoritve)

49 talalat: 0 blokkolo, 15 fontos, 29 kellemetlen, 5 otlet. lint/typecheck/build zold. A build figyelmeztet: a 3 jogi dokumentum vazlat, a Barion logo hianyzik.

Oldaltermkep (V=vendeg, T=diak, A=admin): / Home (V,T,A); /tanulasi-ut LearningPath; /tanulasi-ut/:sav TrackPage; /tanulasi-ut/:sav/:lecke LessonPage (+ masodik URL /leckek/:id, a legtobb link ezt hasznalja); /feladatok TaskList (bejelentkezes utani cel); /feladatok/:id TaskSolve; /vizsgak, /vizsgak/:id, /vizsgak/:id/fut (sajat fejlec), /vizsgak/:id/eredmeny; /beadasok/:id; /szobeli, /szobeli/:tema; /haladas (vendegnek is a menuben, belepesre dob); /arak; /indulas ARVA (nincs ra link); jogi oldalak lablecbol; /elofizetes*, /fiok*; /regisztracio(+/kesz), /bejelentkezes, /elfelejtett-jelszo; e-mail linkes oldalak; /admin/*; * NotFound.

Informacios szerkezet
- IA1 fontos | auth/guards.tsx:36 | belepes utan a generikus /feladatok, nem a "mi a kovetkezo" | szerver oldali kovetkezo lecke; /haladas vagy "folytatas" hero
- IA2 fontos | home/Home.tsx:85 | a Home nem tud a belepett felhasznalorol (vendeg hero, "Belepes nelkul is kiprobalhato") | belepett hero: folytatas, napok a vizsgaig
- IA3 fontos | TaskList.tsx:71, ProgressDashboard.tsx:22 | `lastTask` localStorage (eszkozonkent) | a szerver /progress-bol szarmaztatni
- IA4 fontos | app/App.tsx:49 | /indulas arva; a celok csak a szobelit hasznaljak; a Home a VITE_EXAM_DATE-et | elso belepes utan felajanlani, szemelyre szabni
- IA5 kell. | Onboarding vege fix /tanulasi-ut | elso leckere vigyen
- IA6 kell. | SiteShell.tsx:13-20 | "Arak" elofizetonek is; "Haladasom" vendegnek belepesre dob; desktopon nincs kijelentkezes a fejlecben | menu belepes-allapot szerint
- IA7 kell. | /regisztracio nincs GuestOnly
- IA8 kell. | ket URL egy leckehez
- IA9 kell. | ExamRunner.tsx:101 | futo vizsgabol a logo megerosites nelkul kivisz; sehol nincs beforeunload/useBlocker | kilepes-megerosites vizsgan es feltolteseken
- IA10 kell. | ExamRunner.tsx:255 | a programozasi resz uj lapon nyilik, nincs visszaut | "Vissza a vizsgahoz" sav
- IA11 kell. | nevkeveredes: Gyakorlo vizsgak / vizsgak / feladatsor / feladatlap
- IA12 kell. | "Beadas" = kodbeadas, fajlbeadas es teljes vizsga; "Kuldes", "Ellenorzes", "Megoldas" mashol | szoszedet egysegesitese; vizsga: "Vizsga lezarasa"
- IA13 otlet | SiteShell oldalakon nincs morzsamenu

Kod egeszseg
- CH1 fontos | features/exams/api.ts:7-11, admin/exams/api.ts:3-6, ExamList.tsx:42, ExamStart.tsx:36, AdminExams.tsx:27,44-50, RubricBuilder.tsx:87 | elavult "meg nincs a szerveren" kommentek es `unavailable` agak | torolni, a 404 valodi hiba
- CH2 fontos | AdminOverview.tsx:35-45, overview/api.ts:30 | halott 404-fallback 6 extra lekerdezessel | torolni
- CH3 fontos | useStudyPreferences.ts:28-91, useOralPractice.ts:35-175, preferences.ts, oral/practice.ts | localStorage fallback es egyszeri migracio felesleges belepettnek | csak vendegnek
- CH4 fontos | useOralPractice.ts:131-135 | a `pending` kuldes elott torlodik; nem-404 hiba eseten a piszkozat nem mentodik | megtartani a sikerig, ujraprobalas
- CH5 kell. | FileTaskWorkspace.tsx:33-39 | fajlbeadas nem ervenyteleniti a katalogus/feladatlista cache-t (60 s-ig elavult "megoldva") | kozos invalidate segedfuggveny
- CH6 kell. | ExamRunner.tsx:69 | vizsga beadasa csak examKeys-t ervenyteleniti | haladas es fajlfeladat kulcsok is
- CH7 kell. | halott exportok/asszetek: topicsQuery, InlineCode, FUNCTION_NAMES, hero.png, vite.svg
- CH8 kell. | exams/api.ts PartSubmission.uploaded_at/file_name nullable, de a Resource sosem null; ~28 export csak sajat fajlban hasznalt
- CH9 kell. | 300 sornal hosszabb: TaskSolve 432, AdminExercise 402, AdminExam 358, RubricBuilder 349, AccountProfile 338, formula.ts 321
- CH10 kell. | inline style csak dinamikus ertekre; nincs arbitrary [..], nincs any/console.log (rendben)
- CH11 kell. | jogi dokumentumok vazlatok, Barion logo hianyzik | go-live elott
- CH12 | hangnem kovetkezetesen "te"; nincs angol maradvany (rendben)
- CH13 otlet | ErrorBoundary nincs route-ra kulcsolva: osszeomlas utan teljes ujratoltesig hibas marad | key={pathname}
- CH14 otlet | api.ts es CLAUDE.md szerint "backend meg nincs" | frissiteni

Hozzaferhetoseg / reszponziv
- A1 fontos | nincs fokusz/gorgetes kezeles utvonalvaltaskor, nincs bejelentes
- A2 fontos | index.html:7 | egyetlen statikus <title> | useDocumentTitle oldalankent
- A3 fontos | SiteShell | nincs "ugras a tartalomra" link; <main> oldalankent ismetelve
- A4 kell. | Modal.tsx | nincs bezaro gomb es hatterkattintas
- A5 kell. | Form.tsx:57-70 | hibas kuldes utan nem lep az elso hibas mezore a fokusz
- A6 kell. | lablec es szovegkozi linkek kisebbek 44 px-nel
- A7 kell. | MonacoCodeEditor.tsx:80-88 | mobilon nincs Tab-kilepesi tipp es textarea fallback
- A8 kell. | ExamRunner.tsx:111 | role=timer nem jelentodik be, nincs figyelmeztetes a hatarido kozeleben | aria-live 10/5/1 percnel
- A9 otlet | text-muted kontraszt ellenorizetlen

Teljesitmeny
- P1 fontos | Monaco chunk 3.93 MB (1.0 MB gzip), minden kodfeladatnal toltodik; removable 104 kB, Prose 156 kB | csak Python/C#/SQL nyelv es worker; idle elotoltes
- P2 kell. | 21 woff2 fajl (kiilonbozo alkeszletek) | csak latin es latin-ext
- P3 | belepesi chunk 281 kB (88 kB gzip), minden oldal lazy (rendben)
- P4/CH5/CH6 | staleTime 60 s, nincs fokusz-ujratoltes -> az elavulas innen
- P5 kell. | katalogusfa agankenti kerelmekbol, a leckestatusz kulon | egy vegpont

Hianyzo diak funkciok
- F1 fontos | nincs szerver oldali "folytatas" (IA1-3)
- F2 fontos | nincs kereses leckek/feladatok kozott
- F3 fontos | beadas-elozmeny csak a feladaton belul | "Beadasaim" lista
- F4 kell. | a backend tud export-ot, a UI csak torlest mutat
- F5 kell. | nincs emlekezteto, sorozat, heti cel kovetes (a weekly_hours mar mentve van)
- F6 kell. | vizsgaeredmeny elozmeny/trend hianyzik
- F7 otlet | Ctrl+Enter futtatas (nem ellenorzott), sotet tema
