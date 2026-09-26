# InfoTanar.hu

Felkeszito webalkalmazas a magyar kozep- es emelt szintu **digitalis kultura erettsegire**.
A felhasznalo kivalaszt egy programozasi feladatot, megirja a megoldast a beepitett
kodszerkesztoben, lefuttatja, es automatikus kiertekelest kap.

> Prototipus. A reszletes tervet lasd: [PLAN.md](PLAN.md)

## Stack

| Reteg | Technologia |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, Monaco Editor |
| Backend | PHP 8.3 + Laravel 11 (API-only) |
| Adatbazis | MySQL 8 (eles), SQLite (fejlesztes) |
| Kodfuttatas | Judge0 CE (sajat hosztolas) |
| E2E teszt | Playwright |
| CI/CD | GitHub Actions -> SSH deploy |

## Mappastruktura

```
infotanar/
├── frontend/   # React + Vite app
├── backend/    # Laravel 11 API
└── .github/workflows/
```

A lokalis fejlesztes es a deploy leirasat a fejlesztes vegen ez a README tartalmazza.
