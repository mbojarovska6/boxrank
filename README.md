# BoxRank

[![CI/CD](https://github.com/mbojarovska6/boxrank/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/mbojarovska6/boxrank/actions/workflows/ci-cd.yml)

BoxRank je spletna rešitev, ki centralizira podatke o boksarjih, klubih in dvobojih
ter po vsakem potrjenem dvoboju avtomatsko preračuna rating boksarja (po principu,
podobnem Elo sistemu). Na podlagi ratinga in kategorije teže sistem tudi predlaga
primerne naslednje nasprotnike, kar olajša pošteno organizacijo dvobojev.

Projekt je nastal v okviru predmeta RIRS.

## Ciljni uporabniki

- Lokalne boksarske zveze / krovne organizacije
- Trenerji in promotorji klubov
- Boksarji
- Navijači in širša javnost

## Tehnologije

| Del sistema       | Tehnologija                                   |
|--------------------|------------------------------------------------|
| Frontend           | React (Vite), React Router, Axios/Fetch        |
| Backend            | Node.js, Express.js (REST API)                 |
| Podatkovna baza    | PostgreSQL                                      |
| ORM / migracije    | Prisma                                          |
| Avtentikacija      | JWT, bcrypt                                     |
| Lokalni razvoj     | Docker / Docker Compose                         |

## Struktura repozitorija

```
projekt/
├── README.md
├── .gitignore
├── frontend/           # React SPA (frontend aplikacija)
├── backend/            # Node.js/Express REST API
└── docs/               # projektna dokumentacija
    ├── 01-zasnova-resitve.md
    ├── 02-funkcionalnosti-in-obseg.md
    ├── 03-podatkovni-model.md
    ├── 04-arhitektura-in-tehnoloski-sklad.md
    ├── 05-uporabniske-zgodbe.md
    ├── 06-wireframes.md
    ├── wireframes/      # slike wireframe-ov
    └── adr/             # arhitekturne odločitve (MADR)
```

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframes](docs/06-wireframes.md)
- [Arhitekturne odločitve (ADR)](docs/adr/)

## Razvojni proces

Razvoj poteka po strategiji **GitHub Flow**: veja `main` je zaščitena, vse
spremembe se vanjo združujejo izključno preko pull requestov.

## Deployed application

- Application: https://boxrank-mbojarovska.netlify.app
- Backend API: https://boxrank-backend.onrender.com

The backend runs on Render's free plan and sleeps when it is not used, so the first request can take up to about 50 seconds.

## CI/CD pipeline

The pipeline is defined in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) and runs on every pull request to `main` and on every push to `main`.

| Job | What it does |
|---|---|
| `lint` | Runs ESLint on the backend and the frontend. Any lint error fails the job. |
| `build` | Installs dependencies (with npm caching), builds the backend (TypeScript) and the frontend (Vite), and uploads the builds as artifacts (`backend-build`, `frontend-dist`). |
| `test` | Runs the Vitest tests of the backend and the frontend with coverage and uploads the coverage report as an artifact (`coverage-report`). A failing test fails the job. |
| `deploy` | Runs only on a push to `main` and only after `lint`, `build` and `test` succeed. Uses the `production` environment and the build artifacts (no rebuild): the backend build is packaged as a Docker image and deployed to Render together with a PostgreSQL database, and the frontend is deployed to Netlify. |

The frontend gets the address of the deployed backend from the `VITE_API_URL` variable. Tokens and deploy hooks are stored in GitHub Secrets. The `main` branch is protected: changes are merged only through pull requests, and the `lint`, `build` and `test` checks must pass.
