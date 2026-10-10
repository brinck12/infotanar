# FRONTEND.md

Everything needed to build and keep consistent the InfoTanár frontend: design language, components, every page, the contract with the backend, and what is still open. Written after the full UI/UX mock-up (65 boards) was finished. The existing code in `frontend/src` is the *old* dark prototype UI; this document describes the **target**.

Contents: 1 Where things live · 2 Product scope · 3 Design language · 4 Tokens · 5 Components · 6 Shells and responsive rules · 7 Page map · 8 Task workspaces · 9 File-based tasks (Word/Excel/Slides/Web) · 10 Exams and oral · 11 Backend contract (existing and new) · 12 Curriculum · 13 Exam facts · 14 Copy rules · 15 Accessibility · 16 Placeholders and open decisions · 17 Build order · 18 What was verified

---

## 1. Where things live

- **Design mock-up (source of truth for look and flows):** https://claude.ai/artifact/MbuQsDEJQXunrn5c18LWPX (a Design canvas, 65 boards, sharing was set to "anyone with the link"). Each board is one self-contained `project/<Name>.dc.html` file; read them with the Artifact tool (`action: "read"`, `path`). Hungarian copy in the boards is the real UI copy.
- **Only one board is interactive:** `Main.dc.html` (home hero demo: run, fix the bug, submit, hidden tests). All other boards are static states.
- **The mock-up was produced by a Python generator** that lived in a temp scratchpad (not saved in the repo). If boards must be regenerated, re-create them from this document or edit the published files. Board names below are the file names.
- **Current code to be restyled:** `frontend/src` (React 19, Vite 8, Tailwind 4, TanStack Query, Axios, Monaco, oxlint). Structure: `app/` (Providers, routes.tsx with lazy `page()` helper, ErrorBoundary), `features/{admin,auth,billing,catalog,home,progress,workspace}`, `shared/{api,config,domain,hooks,ui}`. Today `shared/ui` has only `Form.tsx`, `LockIcon.tsx`, `PageLoader.tsx`, `SplitPane.tsx`; 34 files use hard-coded `slate-950` / `sky-*` classes (dark theme). Routes already exist for most pages (section 7).
- Related docs: `CLAUDE.md` (commands, architecture), `docs/api-endpoints.md` (route list), `docs/adr/` (Barion, Számlázz.hu), `tests/README.md` (Playwright).

## 2. Product scope the UI must cover

InfoTanár prepares students for the Hungarian **digitális kultúra érettségi** (közép and emelt). The exam is **not only programming**. Verified point split (practical part):

| Level | Time | Points |
|---|---|---|
| Közép | 180 min | Szövegszerkesztés 25 (45 min), Vizuális elemek (grafika + bemutató) 20 (35), Táblázatkezelés 25 (40), Adatbázis-kezelés 15 (30), Algoritmizálás és programozás 15 (30) |
| Emelt | 240 min | Dokumentumkészítés **or** táblázatkezelés 35 (70 min, the student picks one), Adatbázis-kezelés 35 (70), Algoritmizálás és programozás 50 (100) = 120; plus szóbeli (20 min, 30 pt) |

So the product has **six learning tracks + oral**: Programozás, Adatbázis-kezelés, Táblázatkezelés, Szövegszerkesztés, Grafika és bemutató, Weboldal, and Szóbeli. Freemium rule (backend, `ContentAccess`): the first 2 lessons per track are free, even without login; everything else needs Prémium (2 990 Ft/month, Barion, Számlázz.hu invoices).

Audience: 17–18 year olds stressed about the exam, and parents who pay. Tone: calm, trustworthy, a little warm, like a good notebook or textbook.

## 3. Design language

- **Light theme.** Pale cool paper background, white panels, near-navy ink, **one accent: deep green**. Red is reserved for wrong/destructive. The code editor stays dark.
- **Signature motif: the Hungarian *kockás füzet* (squared notebook).** A 24 px grid of `grid`-coloured lines is used **only behind the home hero** (`background-size:24px 24px`). Progress squares (tiles) echo it. Do not spread the grid over other pages.
- **Boldness in one place:** the live editor demo on the home page. Everything else is quiet.
- **Typefaces:** Literata (serif) for headings and task text (textbook voice); Figtree (sans) for UI; JetBrains Mono for code, with **ligatures disabled** (`font-variant-ligatures:none`) so `>=` stays `>=`. All three support ő/ű.
- **Structure carries information:** numbering only for real sequences (stages, steps); dotted leaders only in the lesson contents list; dashed border = hidden/draft; filled ink badge = Emelt szint, outlined = Középszint.
- **Avoided on purpose:** cream + terracotta, gradients as decoration, left-border cards, emoji, all-caps eyebrows, scattered entrance animations, shadows on every card. Shadow is used only on the editor/work sheet (`radius lg`).
- **Motion:** only responses to the user (test rows appearing one by one in the demo), and `prefers-reduced-motion` skips it.

## 4. Tokens (Tailwind v4 `@theme`, goes to `frontend/src/index.css`)

```css
@theme {
  --color-*: initial;                       /* wipe the default palette: unknown colours cannot be written */
  --color-paper: #F6F7F4;   --color-sheet: #FFFFFF;
  --color-grid: #E1E7E3;    --color-line: #D5DCD8;
  --color-ink: #1A2330;     --color-ink-soft: #4A5666;   --color-muted: #7C8794;
  --color-accent: #0B6B58;  --color-accent-dark: #09493C; --color-accent-soft: #DCEFE8;
  --color-wrong: #B3321F;   --color-wrong-soft: #F8E3DE;
  --color-code: #16202B;    --color-note: #ECEFEA;  --color-chip: #E9EEEA;
  --color-faint: #FAFAF8;   --color-headrow: #F1F3EF;
  --font-serif: "Literata", Georgia, serif;
  --font-sans: "Figtree", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --spacing: 4px;
  --radius-sm: 4px;  --radius-md: 8px;  --radius-lg: 14px;
}
```

(`faint` #FAFAF8 = locked card background; `headrow` #F1F3EF = table header and inline-code background; both are used in the boards but were missing from the design-system board's swatches.)

- **Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 72 px only. Page gutter 24 px (16 px under 760 px). Content max-widths: pages 1200, workspaces 1360, auth cards 460, prose 60–66 ch.
- **Radius:** `sm` 4 = badges, small inline elements; `md` 8 = buttons, fields, cards, panels; `lg` 14 = the editor/work sheet, important highlighted panels (ink border), modals.
- **Type scale:** serif 54/1.12 (home h1, weight 600, tracking -0.015em), 42–44 (page h1), 28, 24, 20–22 (card titles), 18/1.7 (task text); sans 19/1.6 (lead), 16/1.5 (UI), 15, 14, 13 (badges); mono 14/1.7. Line length < 66 ch. Serif text gets looser line-height than sans.
- **Syntax colours (on `code`):** default `#E3EAF0`, keyword `#E7A6BA`, builtin `#8FD0C0`, number `#F0CB8A`, comment `#7C8B99`, gutter `#5E6E7D`, secondary text on dark `#9AA8B5`, nested panel `#0F1821`, borders on dark `#2A3846`/`#5E6E7D`.
- **Elevation:** `0 1px 0 line, 0 28px 44px -30px rgba(26,35,48,.4)` for the work sheet only; modal `0 30px 60px -20px rgba(0,0,0,.5)` over `rgba(26,35,48,.55)`.
- **Focus:** 3 px `accent` outline, 2 px offset (`#8FD0C0` on dark surfaces).

### UI rules for CLAUDE.md (target state, not yet added there)
1. Use only components from `src/shared/ui`. 2. Colour, type, spacing and radius only from tokens; no `p-[13px]`, `bg-[#fff]`. 3. One accent (green); red only for errors and destructive actions; state is never colour-only (always icon or text). 4. No new card, button or badge style without approval. 5. Editor dark, everything else light, text contrast ≥ 4.5:1. 6. Buttons, fields, menu items ≥ 44 px high; in-text and table-row links ≥ 24 px target; visible focus ring; icon-only buttons need `aria-label`. 7. Hungarian copy, sentence case, no exclamation marks; errors say what happened and what to do. 8. Motion only as a response to user action; honour `prefers-reduced-motion`.

## 5. Components (`frontend/src/shared/ui`)

Each exists in the mock-up; the **Designrendszer** board shows all of them.

| Component | Variants / notes |
|---|---|
| `Button` | `primary` (green, one per view), `secondary` (white, ink border), `text` (green underlined), `danger` (red), `dark` (on code surfaces), `disabled`; sizes 52 px (hero) and 44 px; optional leading icon. Renders `<a>` when it navigates. |
| `Badge` | `kozep` (outlined), `emelt` (ink fill), `lang` (chip), `free`/`ok` (accent-soft), `bad` (wrong-soft), `prem` (outlined + lock), `hidden` (dashed + lock), `manual` (outlined + eye), `neutral`, `now`, `pub`, `draft` (dashed), `admin`. 13 px/600. |
| `Field`, `Select`, `Textarea` | Visible label above, 48 px, 1 px `muted` border, hint under, error under with warn icon and text, optional right-aligned label link (e.g. "Elfelejtetted?"). Real `<label for>`. |
| `Check`, `Radio`, `Switch` | 22 px native controls with `accent-color`; switch has `role="switch"`. |
| `Banner` | `info` (note bg), `warn` (white, ink border), `error` (wrong-soft, red border), `success` (accent-soft). `role=alert` for error. Optional action. |
| `Panel` | `sheet` (white, 1 px line, radius md), `work sheet` (radius lg + shadow), `highlight` (ink 1 px border, radius lg), `note` (note bg, no border). |
| `Table` | Header row `headrow`, 14 px bold; dense variant; horizontal scroll inside the box on narrow widths; real `<th scope>`; optional caption. |
| `Tabs` | `role=tablist`; active tab white with 3 px green bottom border. |
| `Tiles` / `Bar` | Progress squares (filled green vs outlined) and a rounded bar; always paired with a number. |
| `Breadcrumb` | `<nav aria-label="Morzsamenü">`, last item `aria-current`. |
| `Modal` | Ink 55% backdrop, white radius-lg dialog, `role=dialog aria-modal`, actions right-aligned (secondary left, primary right; danger for destructive). Needs focus trap and Esc. |
| `Toast` | Dark ink pill with icon, bottom centre; `role=status`. |
| `Skeleton`, `EmptyState` | CHIP-coloured bars with `aria-busy`; dashed-border empty box with one action. |
| `TaskCard` | Title (serif 21), level badge + language badges, difficulty squares (n/5), status line under a rule: `Teljesítve` (green, check), `Folyamatban`, `Még nem kezdted el`, locked (faint background + lock + "Prémium kell hozzá"). Same layout in every state. |
| `ExamCard` | Year + level badge, minutes and points, part list with icons, status, one action. |
| `ResultRow` | State icon, name, verdict badge, optional diff (Bemenet / Várt / Kapott in mono). Hidden tests show only `Rejtett` + verdict, never data. |
| `RubricItem` | State icon (ok/bad/manual), text, points badge (`2 / 2 pont`, `0 / 2 pont`, `1 pont, kézi`), "Amit találtunk: `value`" in mono, optional hint sentence. The core pattern of every file-checked task. |
| `Dropzone` | `empty` (dashed, upload icon, file button), `uploading` (progress bar), `done` (green border, name, size, time, "Másik fájl"). Shows accepted extensions. |
| `FileChip` | Download chip with file icon, mono name, size. |
| `CodeEditor` | Monaco in a dark `code` surface, file tabs (e.g. `varos.py`, `mx234.txt`), action bar (Futtatás primary, Beadás dark), output pane, result area. |
| `SheetGrid` | Read-only grid for samples and the browser practice sheet: column letters, row numbers, selected cell outline, formula bar (`D2`, `fx`, formula with the function highlighted), sheet tab, toolbar. |
| `DocThumb`, `SlidePreview` | Thumbnail of the student's uploaded document/slide (rendered server-side) next to the sample. |
| `Stat` | Label, serif 34 number, note. Used on progress and admin overview. |
| `Logo` | 3×3 squares, middle one green + "InfoTanár" in Literata 650. |

Icons: one outline set, 20 px, stroke 1.8, round caps (check, x, plus, lock, play, upload, download, file, clock, info, warn, user, menu, search, trash, drag, edit, eye, chevrons, sheet, doc, slides, db, code, globe, mic, calendar, card, mail, shield, refresh, star, flag, book, list, home, logout, image, bold, italic, underline, align×3, undo, dots, bar). Decorative icons `aria-hidden`.

## 6. Shells and responsive rules

| Shell | Used for | Notes |
|---|---|---|
| `SiteShell` (guest / user / admin) | home, path, tracks, lessons, lists, exams, oral, progress, pricing, system pages | Header: logo left; nav (**Tanulási út, Feladatok, Gyakorló vizsgák, Szóbeli, Haladásom, Árak**); right: guests get `Belépés` + `Regisztráció`, users get name + initial avatar (link to Fiók), admins also get `Admin`. Footer: sandbox sentence + ÁSZF, Adatkezelés, Kapcsolat. Active nav = bold + 3 px green underline. Pass no active item on the home page. |
| `WorkspaceShell` | every task page | Compact white header: logo, breadcrumb, avatar. Full-width two columns (task left 400–580 px, work area right, `flex-wrap`). |
| `AuthShell` | login, register, forgot, reset | Logo top-left, one centred 460 px card, footer. |
| `AccountShell` | profile, subscription, payments, billing | Left menu (Profil, Előfizetés, Fizetések és számlák, Számlázási adatok, Kilépés) + 560–760 px content. |
| `AdminShell` | all admin | Workspace header with `Admin` badge, left menu (Áttekintés, Katalógus, Gyakorló vizsgák, Felhasználók, Számlák) + content. |
| `ExamRunnerShell` | running exam | Header with exam name, **timer (`role=timer`)**, Beadás; left part list with status; one part at a time. |

- **Responsive:** pages are fluid, built with `flex-wrap` and `min-width:0`; two-column work areas stack under ~900 px. Under **760 px** the desktop nav collapses to a 44 px menu button that opens a vertical list (`MobilMenu` board). Gutters shrink to 16 px. Tables scroll inside their box. Mobile boards (390 px) exist for home, menu, task list, programming workspace, spreadsheet task, progress, exam runner.
- Every full-height page uses `min-height:100vh` with the footer pushed down (header must be `width:100%` inside a column flex).
- Link targets: header/nav/footer links 44 px; table-row links 32 px; in-text links ≥ 24 px (`a{padding-block:3px}` globally).

## 7. Page map (board → route → purpose)

Existing routes are from `frontend/src/app/App.tsx`. "New" routes are proposals following the existing Hungarian slug style.

| Board file | Route | Purpose and key states |
|---|---|---|
| `Main` | `/` (exists) | Hero with live demo; six-track grid; how it works (Tanulsz, Gyakorolsz, Vizsgázol); price + "Ha te fizeted". Countdown sentence uses a tweakable exam date. |
| `Tanterv` | `/tanulasi-ut` (new) | "Hol vannak a pontok?" bar (közép/emelt switch), track tabs, 14 programming stages (done / doing with expanded lessons / locked / exam), facts panel, other tracks grid. |
| `Sav` | `/tanulasi-ut/:sav` (new) | Track overview: modules with progress tiles, lessons with type icon and Ingyenes/Prémium badge, sidebar with count and how practice works. Shown for Táblázatkezelés. |
| `Lecke` | `/leckek/:id` (new; backend has lesson video routes) | Video player (captions on, speed), "Megnéztem" check, Következő lecke, tabs (Jegyzet, Átirat, Gyakori hibák), module outline, practice list. |
| `Zarolt` | same page, three variants | Guest: Belépés/Regisztráció. Unverified e-mail: resend, change address. No subscription: Prémium CTA. Matches `AccessDenial` (LoginRequired, EmailUnverified, SubscriptionRequired). |
| `Arak` | `/arak` (new) | Free vs Prémium comparison table, plan panel, FAQ (`<details>`). |
| `Megrendeles` | `/elofizetes` (exists, `Subscribe`) | Steps (Fiók, Számlázási adatok, Fizetés), customer type radio, Hungarian tax-number validation error, ÁSZF checkbox, order summary, "Fizetés Barionnal". |
| `FizetesVissza` | `/elofizetes/visszateres` (exists) | Three states: success, still processing (refresh), failed (retry). |
| `Belepes`, `Regisztracio`, `RegKesz`, `Megerosites`, `Elfelejtett`, `UjJelszo` | `/bejelentkezes`, `/regisztracio`, `/regisztracio/kesz`, `/email-megerosites`, `/elfelejtett-jelszo`, `/jelszo-visszaallitas` (exist) | Auth. Forgot-password always shows the same neutral success text (no account enumeration). Verify page: success / expired / already verified. Password rule: min 8, letters and numbers. |
| `Inditas` | `/indulas` (new) | Four goal questions (szint, vizsgaidőszak, programnyelv, heti óra) + "Ez lesz a terved". Skippable (`Később`). |
| `Feladatok` | `/feladatok` (exists) | Continue panel, filters (Téma, Szint, Állapot), sections per track with tiles, upsell strip. |
| `Megoldas` | `/feladatok/:id` (exists, `TaskSolve`) | Programming task (közép): task text, constraint note, Monaco, Futtatás/Beadás, results with hidden tests. |
| `FeladatFajl` | same, file variant | Emelt programming with source files, file tabs, per-subtask scoring from `N. feladat` headers. |
| `FeladatSql` | same, SQL variant | Schema panel, `.sql` editor, run, compare actual vs expected rows, subtask list with required query names. |
| `FeladatTablazat`, `FeladatSzoveg`, `FeladatVizualis` | same, upload variants | See section 9. |
| `GyakorloTablazat`, `GyakorloSzoveg` | same, in-browser variants | Section 8. |
| `FeladatWeb` | same, web variant | Files (HTML, CSS), editor, live preview, live checks. |
| `KeziEllenorzes` | modal | Self-marking of items the checker cannot decide. |
| `Vizsgak`, `VizsgaIndit`, `VizsgaFut`, `VizsgaBeadas`, `VizsgaEredmeny` | `/vizsgak`, `/vizsgak/:id`, `/vizsgak/:id/fut`, modal, `/vizsgak/:id/eredmeny` (new) | Section 10. |
| `Szobeli`, `SzobeliTetel` | `/szobeli`, `/szobeli/:tema` (new) | Section 10. |
| `Haladas` | `/haladas` (exists) | Countdown card with continue button, three stats, readiness per exam part (estimate), practice calendar (20 weeks of squares), weak topics, recent work. |
| `Fiok` | `/fiok` (new) | Profil, E-mail-cím (verified badge, change with password), Jelszó, Az adataim (JSON export), Fiók törlése (red, password). |
| `Elofizetes`, `ElofizetesAllapotok` | `/fiok/elofizetes` (new) | Active plan (next charge, card, change card, cancel), history; states: past_due with grace days, cancelled-but-active with resume, none; cancel confirmation modal. |
| `Fizetesek` | `/fiok/fizetesek` (new) | Payments table with invoice states (download, being prepared, none after failure). |
| `Szamlazasi` | `/fiok/szamlazasi-adatok` (new) | Customer type, company name, address, tax number, invoice e-mail. |
| `Emailek` | transactional | Verify, payment failed (grace date), invoice ready, password reset. One button each. |
| `Admin` | `/admin` (exists) | Stats and to-do list, recent admin actions. |
| `AdminKatalogus` | `/admin/tananyag` (exists) | Tree of track > module > lesson > exercise with drag handles, Közzétéve/Piszkozat, Ingyenes, edit/delete. |
| `AdminSav`, `AdminModul`, `AdminLecke` | `/admin/tananyag/agak/:id`, `/modulok/:id`, `/leckek/:id` (exist) | Forms, ordered child lists. Lesson: private video + `.vtt` captions upload, free toggle, exercises. |
| `AdminFeladat`, `AdminTesztek`, `AdminSzabalyok`, `AdminErtekelolap` | `/admin/tananyag/feladatok/:id` (exists, split into tabs) | Description (Markdown + preview) and starter code; test cases (hidden toggle, order, run with reference solution); code rules (required/forbidden constructs); **rubric builder** for file tasks (new). |
| `AdminVizsga` | `/admin/vizsgak/:id` (new) | Exam metadata, ordered parts (points, minutes, linked exercise, rubric status), source zip + PDF links, publish blocked while a rubric is incomplete. |
| `AdminFelhasznalok`, `AdminFelhasznalo` | `/admin/felhasznalok`, `/:id` (exist) | List with search and filters; detail with actions (role, verification mail, mark verified, password-reset mail, revoke tokens), manual access grants, payments, log, export, delete. |
| `AdminSzamlak`, `AdminSzamlaAdat` | `/admin/szamlak` (exists) | Failed invoices with reason, retry, buyer-data fix modal. |
| `Hibak` | `*` and error boundary | 404, 500, 429 (code-run limit 10/min), 403. Each says what happened and what to do. |
| `Allapotok` | components | Toasts, skeleton, empty state, runner messages (Judge0 down, constraint violation, only public tests ran, success, offline), confirm modal, cookie notice. |
| `Jogi` | `/adatkezeles`, `/aszf` (new) | Long-form prose layout with contents list. Text is a placeholder. |
| `Rendszer` | — | Design system board. |
| `Mobil*` (7) | — | 390 px renderings of the above. |

## 8. Task workspaces

All workspaces: task on the left (serif, textbook look), work area on the right in a `lg` sheet. A 3 px green focus ring everywhere, results announced with `aria-live="polite"`.

- **Programozás (közép):** Python 3 / C# toggle, "Kiinduló kód visszaállítása", Monaco. **Futtatás** runs visible tests only and stores nothing. **Beadás** runs all tests and saves. Hidden tests: only `Rejtett` + verdict. Verdict labels from the backend (`Elfogadva`, `Hibás kimenet`, `Időkorlát túllépve`, `Fordítási / szintaktikai hiba`, `Futásidejű hiba`, `Rendszerhiba`, `Szabálysértés`). Code rules shown as a note above the task ("Kötelező: ciklus. Tiltott: sum()"). Drafts persist per user (existing `useCodeDraft`).
- **Programozás emelt, files:** source files as chips; Monaco with tabs for the program and each data file; output pane; result scored **per subtask** by splitting stdout on `N. feladat` headers, with partial points (the exam awards partial points even to crashing programs). The grader should compare numbers and key content, not exact wording ("tartalmilag a mintának megfelelően", unaccented text accepted). Output files (e.g. `vX.txt`, `tabla.html`) are checked after the run. Run limit stays 45 s per evaluation (below the frontend's 60 s timeout).
- **SQL:** dialect **MySQL/MariaDB** (the exam uses MariaDB via phpMyAdmin at emelt; Access or LibreOffice Base with MySQL at közép), **not SQLite**. Schema browser with keys, per-subtask list with required file names (`4tobb80`), results compare "Az eredményed: N sor" vs "Várt eredmény: N sor", order ignored unless the task asks for sorting. Save as `.sql`.
- **Táblázat, böngészős gyakorló (`GyakorloTablazat`):** small sheet with toolbar, name box, formula bar, sheet tab and an auto-checked checklist (cell has a formula, references the right cell, copied down the range). For short drills in lessons; no installed program needed. Magyar function names and `;` separators, `,` decimal.
- **Szöveg, böngészős gyakorló (`GyakorloSzoveg`):** ribbon-lite (style, font, size, B/I/U, alignment ×3, list, line spacing), ruler with a tab stop, paper page, live checklist (alignment, size, bold, spacing, tab stop type and position).
- **Weboldal:** file tabs (HTML, CSS, linked page), dark editor, light browser-frame preview, live checks (title text, font family in CSS, number of `div`s, class used, link to the other page).
- **Grafika és bemutató:** upload only (the programs are Inkscape/GIMP/PowerPoint/Impress). Rendered thumbnails of the uploaded slides next to the sample, automatic checks (slide count and size, background gradient, font, title size, transition) and manual items.

## 9. File-based tasks (Word, Excel, slides, graphics)

**Decision:** real exam tasks are solved in the student's own program (Word/Writer, Excel/Calc, PowerPoint/Impress, Inkscape, GIMP), because that is what the exam uses (software list: MS Office 2021, LibreOffice 25.2, GIMP 3.0, Inkscape 1.4, Python 3.13, VS Code, Visual Studio 2022, JDK 24 and others). The site gives the task, source files and sample, the student uploads the result, and the server **parses the file and scores it against a rubric item by item**, like the official *javítási-értékelési útmutató*. In-browser mini editors exist only for short lesson drills.

Page layout (`FeladatTablazat`, `FeladatSzoveg`, `FeladatVizualis`): left task panel (title, badges incl. exam session, intro, **source files**, numbered steps, sample); right column: **1 Dolgozz a saját programodban** (save name and format hint), **2 Töltsd fel** (Dropzone), then the **result panel**:
- big score `19 / 25 pont`, attempt badge ("2. próbálkozás", previous score), group summaries with bars (e.g. Betöltés és képletek 9/12, Rendezés 2/3, Formázás 6/8, Nyomtatási terület 0/2);
- Értékelőlap: one `RubricItem` per exam point, with found values in mono and a hint when wrong;
- for documents: "Amit a fájlban találtunk" (page size, margins, base font, styles, images with widths, columns) and thumbnails Minta vs A te dokumentumod;
- actions: "Javított fájl feltöltése", "Próbálkozások", "Kézi pontok jelölése";
- footnote: automatic checks read file content; visual parts are for the student to compare with the sample.

**Rubric item types** (admin picks one, with expected value, points, auto/manual, hint): *spreadsheet:* cell value, cell formula (pattern, uses function X, references range, copyable/consistent down a range), number format, column width/visibility, sort order, filter result on another sheet, conditional formatting, chart (type, title, axis titles, range, position), print area, sheet name; *document:* page size/orientation/margins, character format (font, size, bold, italic, small caps, colour, super-/subscript), paragraph format (alignment, spacing, indents, line spacing, hyphenation), style exists/applied (Címsor, custom), list type, table (rows, columns, borders, widths, heights, shading, alignment), image (size, aspect ratio, position/wrap, alt text), tab stops (position, type, leader), sections/columns, page break before, text box; *presentation:* slide count/size, background (solid/gradient/image), master fonts, title size, shapes and fill/transparency, animation (effect, timing), transition, loop; *web:* title text, element counts, class usage, CSS properties, links, image dimensions; *manual:* "compare with sample" items marked by the student.

**Scoring conversion:** many tasks use a different raw maximum than exam points (2026 május emelt: programming 54 → 50, SQL 41 → 35, document 42 → 35, spreadsheet 40 → 35); store raw points and the official conversion factor, always floor.

**Manual items:** the student confirms each (`Megvan` / `Nincs meg`) in the `KeziEllenorzes` modal against the sample; the total updates. Nothing goes to a staff queue; admins only complete rubrics.

**Security and limits (backend):** accept only `.docx .odt .xlsx .ods .pptx .odp .svg .html .css .sql .py .cs .txt .png`; size limits; reject macros (`.docm`, `.xlsm`); parse OOXML/ODF as zip with entry-count and uncompressed-size caps (zip bombs), no external entity resolution; render thumbnails in a sandbox (LibreOffice headless); virus scan if available; store per user and attempt.

## 10. Exams and oral

- **`Vizsgak`:** cards for each session (2024 május/október, 2025 május/október, 2026 május) × level, with parts, points, minutes and status; filters Szint and "Teljes feladatsor / Egy rész külön"; info banner that tasks are the official OH papers and marking follows the official guide.
- **`VizsgaIndit`:** two modes. **Vizsgahelyzet** (full time, timer cannot be paused, auto-submit at the end) and **Gyakorlás időkorlát nélkül** (time only measured, pause and per-part submit allowed). Pre-flight checklist (programs open, source zip downloaded and unpacked, Hungarian regional settings: decimal comma, semicolon list separator), parts list, zip download, Indítás.
- **`VizsgaFut`:** timer, Beadás, part rail with status, one part at a time with its sources and dropzone. Programming parts use the editor workspace. Evaluation happens after submit, for all parts together.
- **`VizsgaBeadas` (modal):** per-part file status, warning when parts are empty, back / submit.
- **`VizsgaEredmeny`:** total (e.g. 81 / 100, 81 percent), banner when manual points are pending, per-part bars with the main reason points were lost and a link to the rubric, "Ezt érdemes átnézni" lesson links, retry. **No grade is shown** because the official grade thresholds were not verified; show percent and points, grade only once the thresholds are confirmed from OH.
- **`Szobeli`:** how the oral works (draw a tétel; A = one of six theory topics, B = programming task solved offline during preparation; prep 30 min and answer 20 min at emelt, 15 min answer at közép), scoring table (emelt: A 8, B 10, logical structure 4, expression 4, communication 4 = 30), six topic cards (Szövegszerkesztés, Számítógépes grafika és képszerkesztés, Bemutatókészítés, Publikálás a világhálón, Táblázatkezelés, Adatbázis-kezelés).
- **`SzobeliTetel`:** prep timer, A) outline checklist and notes, B) task with a small runnable editor, self-assessment buttons 0–4 for the three soft criteria, "Felelet indítása". Outline content is placeholder (section 16).

## 11. Backend contract

### Used as-is (see `docs/api-endpoints.md`, `backend/routes/api.php`)
Auth (`/auth/register|login|logout|me|verify-email|forgot-password|reset-password|email/verification-notification`), account (`/account/export|email|password|profile`, `DELETE /account`), catalog (`/tracks`, `/tracks/{slug}`, `/topics`, `/tasks`, `/tasks/{id}`, `/languages`, lesson `video`, `video/stream`, `video/captions`), execution (`POST /run`, `POST /submissions`, rate limit `10/min`), progress (`/progress`), billing (`/billing/plan|checkout|payments|payments/{id}/invoice|profile|subscription|subscription/cancel|resume|card`), webhook (`/webhooks/barion`), admin (tracks, modules, lessons, exercises, test cases incl. reorder, `/admin/constraint-options`, users, access grants, role, verification, tokens, password reset, payments, export, delete, invoices incl. buyer and retry), `/client-errors`, `/health`.

Backend facts the UI depends on: Sanctum bearer token (kept in `tokenStore`), responses wrapped as `{ data: … }`, errors as `{ message, errors? }` in Hungarian, `status: "error"` run response when Judge0 is down (503), hidden results redacted by allow-list, per-limiter 429 messages, soft-deleted users, audit log for admin actions.

### New endpoints and data the mock-up needs (proposals, none exist yet)
| Need | Proposal |
|---|---|
| Typed exercises | `exercises.kind`: `code`, `sql`, `sheet_upload`, `sheet_browser`, `doc_upload`, `doc_browser`, `web`, `visual_upload`; `exam_part` (`szoveg`, `vizualis`, `tablazat`, `adatbazis`, `programozas`); `exam_points`. |
| File submissions | `POST /exercises/{id}/file-submissions` (multipart, one or more files) returns `{ id, status, score, max_score, groups[], items[] }`; `GET` same by id; list of attempts. Items: `{ rubric_item_id, state: ok|bad|manual, points, max_points, found, hint }`. |
| Rubric | `rubric_items` table (exercise, group, label, check type, params JSON, points, mode auto/manual, hint, order) and admin CRUD + reorder + "try with sample solution". |
| Manual marks | `PUT /file-submissions/{id}/manual` with `{ rubric_item_id: bool }`. |
| Source files and samples | exercise attachments (private disk) with signed download URLs; sample images. |
| Per-subtask programming scores | evaluator groups stdout by `N. feladat` and scores with per-subtask tests (numeric/keyword tolerant compare); support input files and output-file checks; `run_files` (additional files to Judge0 or a multi-file run script — verify support on the installed Judge0 version). |
| MariaDB sandbox | Isolated MariaDB for SQL tasks (per-run schema from `taxi.sql`-style dumps); not SQLite. |
| Exams | `exams` (session, level, minutes, points, published), `exam_parts` (exercise, points, minutes, order), `exam_attempts` (mode, started_at, deadline, submitted_at, state), part submissions, result with raw and converted points. Resume after reconnect; server-side deadline. |
| Oral | `oral_topics` with outline items and a B-task each; `oral_attempts` with notes and self-scores. |
| Onboarding | `users.preferences` (level, exam_period, language, weekly_hours, emelt choice document|spreadsheet). Exam date lookup table per period (to be filled from the official schedule; mock uses 2027-05-10 as a placeholder). |
| Progress by exam part | `/progress` extended with points earned vs available per part for the readiness bars (an estimate, label it so), practice calendar (counts per day for 20 weeks), weak-topic list. |
| Admin overview | counts (users, active subscribers, failed invoices, incomplete rubrics) and recent audit entries. |

## 12. Curriculum (content structure the UI shows)

Programming path, 14 stages (derived from the 10 programming tasks 2024–2026): 1 Az első program · 2 Változók és adattípusok · 3 Beolvasás és kiírás · 4 Elágazások · 5 Ciklusok · 6 Listák · 7 Programozási tételek (összegzés, megszámlálás, eldöntés, legnagyobb/legkisebb helyével, keresés, kiválogatás) · 8 Szöveges adatok · 9 Fájlkezelés · 10 Csoportosítás és statisztika · 11 Szimuláció és állapotkövetés · 12 Képletek programban · 13 Középszintű feladatsorok · 14 Emelt szintű feladatsorok. **Hibakezelés (try/catch), függvények/osztályok and rendezés are optional extras**: no exam task required them. Each stage: lessons (video + text), exercises, then exam-style tasks.

Other tracks (topics taken from the 2024–2026 papers, counted by keyword and read for the programming tasks, only skimmed for the rest, so treat as a starting point):
- **Adatbázis (MySQL/MariaDB):** create database, import tab-separated UTF-8 files into tables, SELECT with WHERE/ORDER/LIMIT/DISTINCT, aggregates (COUNT, SUM, MAX, MIN), GROUP BY + HAVING, multi-table queries (join in WHERE or JOIN), LIKE, IN/NOT IN, subqueries, CONCAT, IF, date comparison, named saved queries; emelt adds ALTER TABLE and delivering `.sql` files.
- **Táblázatkezelés:** import text file at A1, new columns/series, copyable formulas (`$`), HA, MIN/MAX/átlag, DARABTELI/DARABHATÖBB, INDEX/HOL.VAN, KEREKÍT, date/time formats (`pp:mm`), cross-sheet references, sort (multi-key), filter and copy to a new sheet, hide columns, formatting (font, rotation, widths, borders, fills, number/currency formats), charts (column, bar, scatter with lines and labels), print area; emelt adds conditional formatting and geographic distance formulas.
- **Szövegszerkesztés (always közép task 1, 25 pt):** page setup, defaults (font, size, spacing, justify, hyphenation), heading formatting and styles, bullet/numbered lists, images (size, ratio, alignment), tab stops with leaders, tables (borders, widths, heights, shading, alignment), columns, page break before heading, small caps, indents, superscript, equations, text boxes, sections.
- **Grafika és bemutató (közép task 2, 20 pt, alternates):** slides (size, background gradient/image, master font/size, text box transparency, shapes, arrows, copying, grouping, alignment, animations with timing, transitions, loop) and pixel graphics (transparent background, layers); emelt: vector (Inkscape shapes, boolean operations, export) and raster layers.
- **Weboldal (emelt dokumentumkészítés):** HTML structure, `<title>`, headings, `div` blocks, classes, CSS file, links between pages, ordered lists, tables, images.

## 13. Verified exam facts and sources

- Structure and points: OH requirement text as mirrored at https://farkascs.hu/dig-kult-erettsegi/ and https://digitaliskulturafelkeszito.hu/digitalis-kultura-erettsegi-minden-amit-tudnod-kell .
- Official papers (all public): `https://dload-oktatas.educatio.hu/erettsegi/feladatok_<év><tavasz|osz>_<kozep|emelt>/<k|e>_digkult_<yy><maj|okt>_<fl|ut>.pdf` — `fl` = task sheet, `ut` = marking guide. 2024 május to 2026 május exist; 2026 október does not yet. The server returns 403 to requests without a browser `User-Agent`.
- Software lists: `https://dload-oktatas.educatio.hu/erettsegi/nyilvanos_anyagok_2026tavasz/digkult_{emelt|kozep}_szoftverlista_2026maj.pdf`. **Languages allowed:** Python 3.13, C/C++ (Code::Blocks), C#/VB/C++ (Visual Studio 2022), Java (JDK 24). Emelt database: MariaDB 10 via phpMyAdmin (no Access). Közép: Access or LibreOffice Base with MySQL. Planned change from 2028: NetBeans removed.
- Programming-task patterns (10 tasks): numbered output "N. feladat" always; közép: data in source in 4 of 5 (must work with other values), one typed-in string; emelt: always read from a file, output file or HTML in 4 of 5; no input validation ever; no sorting; try/catch and functions never required; partial points per step; comments are not graded; unaccented output accepted.
- Marking guide quirks: file name correctness is judged only on first occurrence; "the version with most points counts"; programs without a source file or with compile errors lose the program-name points.
- Emelt 1A (35 pt) varies by year: vector graphics + document (2024 május, 2025 október, 2026 május), raster layers (2024 október), web page HTML/CSS (2025 május).

## 14. Copy rules

Hungarian, sentence case, active voice, plain words, no exclamation marks, no emoji. Buttons say exactly what happens (`Futtatás`, `Beadás`, `Javított fájl feltöltése`, `Fizetés Barionnal`, `Fiók törlése`); the confirmation uses the same verb (`Lemondom`). Errors name the cause and the fix ("A feladat a leggyorsabbat kéri, vagyis a legkisebb időt. A MAX a legnagyobbat adja, használd a MIN függvényt."). Empty states invite one action. Security-sensitive screens never confirm whether an account exists. Prices: `2 990 Ft` with a non-breaking space; dates `2026. október 9.`; decimal comma in prose, decimal point only inside code/sample output. Exam vocabulary to use as is: feladatlap, forrásfájl, értékelőlap, részpont, vizsgapont, középszint, emelt szint, szóbeli, tétel, felelet, felkészülési idő.

## 15. Accessibility

- Contrast (computed): ink on paper 14.7, soft on paper 6.9, accent on white 6.5, white on accent 6.5, wrong on white 6.2, wrong on wrong-soft 5.0, code comment on code 4.7; non-text `muted` border on white 3.65. All text pairs ≥ 4.5:1; code gutter 3.1:1 (non-essential line numbers).
- Never colour alone: every state has an icon or text (✓/✗ circles, badges with words).
- Real elements: `<button>`, `<a href>`, `<input>` with `<label for>`, `<fieldset>/<legend>` for radio groups, `<th scope>`, `<details>` for FAQ, `role=tablist/tab`, `role=switch`, `role=timer`, `role=dialog aria-modal`, `aria-live=polite` on results, `aria-current` on nav/breadcrumb/step.
- Focus ring on everything; modal needs focus trap, Esc, and returning focus. Keyboard drag-reorder alternative needed for admin lists (move up/down buttons).
- Hungarian `lang="hu"`; reduced motion respected; charts and previews have `role=img` + `aria-label`.

## 16. Placeholders and open decisions

- **Placeholders in the mock-up (replace before launch):** exam date `2027-05-10` (use the official schedule); legal text on `Jogi`; oral-exam outline checklist items (generic, not the official tételsor); task difficulty values, levels for the later programming lessons, and the SQL track's single row; student names/e-mail; admin overview numbers; invoice numbers; rubric items for Hyrox/Padel/Időmérő/Garas tasks (modelled on the task steps, not the official marking guide text); "Ezt érdemes átnézni" lesson links.
- **Decisions to confirm:** exam grade thresholds (not shown until verified); whether Java and C++ get lesson content (exam allows them; UI currently offers Python 3 and C#); how much of the official OH papers may be hosted vs linked (mock links to OH for sheets and guides, and hosts only derived tasks); emelt `Dokumentumkészítés vagy táblázatkezelés` selection UI (onboarding stores the choice; exam runner should enforce one of them); dark mode is out of scope.
- **Risks:** Judge0 extra-file and output-file support must be proven; MariaDB sandbox is new infrastructure; OOXML/ODF checking is the largest new backend piece and will never cover purely visual items (hence manual marking); mock-up was rendered only in Chromium via local previews, not inside the artifact viewer.
- **Not designed:** dark theme, in-app notifications, search, certificates, teacher/classroom features, localisation beyond Hungarian, Java/C++ lesson content, profile pictures.

## 17. Suggested build order (most valuable first)

1. Tokens in `index.css`, fonts, `shared/ui` (Button, Badge, Field, Banner, Panel, Table, Tabs, Modal) and the shells; restyle existing pages (auth, task list, task solve, subscribe, progress, admin) without changing behaviour; add the UI rules to `CLAUDE.md`.
2. Navigation and the **learning path** (`/tanulasi-ut`, track page, lesson page) on the existing catalog API; onboarding preferences.
3. **Programming per-subtask scoring and file inputs** (emelt tasks) in the existing run/submit flow.
4. **File upload + rubric engine** starting with spreadsheet and document checks, then slides/web; admin rubric builder; manual-mark modal.
5. **Exam mode** (exams, runner, timer, results) on top of 3 and 4; then SQL (MariaDB sandbox), then oral.
6. Account area (profile, subscription states, payments, billing data), transactional e-mails, legal pages.
7. Browser practice editors (sheet, document) last; they are nice-to-have next to real-program tasks.

## 18. What was verified (and what was not)

- All 65 boards were rendered locally in Chromium at their intended width (1360 or 390 px): **no horizontal page overflow, no controls under the target-size limits** (44 px for buttons/fields, 24 px for text links), markup validated (balanced tags, no iframe/object/embed, no stray scripts), every text/background colour pair in use computed against WCAG 2.x (all pass).
- Read closely: the 10 programming tasks and rubrics (2024–2026), the közép and emelt spreadsheet, word, slide and SQL task steps of several papers. Only keyword-counted: the remaining non-programming tasks.
- **Not verified:** rendering inside the artifact viewer, other browsers, screen-reader behaviour, real data and content, any backend behaviour in section 11 "New endpoints", Judge0 capabilities, official grade thresholds.
- One human edit appeared on the published `Megoldas` board while this was built (the code on line 5 was changed to `osszeg += szam`); the regenerated board restores the deliberate bug because its results show failing tests. Change it back if the edit was intended.
