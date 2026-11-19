# 07 – Project review

Review of the project **BoxRank** (author: Darko Sever), taken over by Matea Bojarovska.

To prepare this review I read the project documentation (`docs/01`–`06`), the architectural decisions (`docs/adr`), the backend and frontend code, and ran the application locally (PostgreSQL in Docker, backend and frontend with `npm run dev`, test data from `prisma/seed.ts`).

## 1. Implemented MVP functionalities

The MVP in `02-funkcionalnosti-in-obseg.md` has seven functionalities. Status: ✅ implemented, ⚠️ partly implemented, ❌ not implemented.

| # | MVP functionality | Status | Where it is implemented | Note |
|---|---|---|---|---|
| 1 | Registration and login with roles | ⚠️ | `auth.routes.ts`, `auth.service.ts`, `Login.tsx`, `Register.tsx` | Registration, login, bcrypt and JWT work. A newly registered promoter has no club and there is no way to create one, so the promoter dashboard shows "Nimate dodeljenega kluba". A registered boxer is not linked to a boxer profile (`Boxer.userId` is never set). |
| 2 | Boxer profile management | ⚠️ | `boxer.routes.ts`, `boxer.service.ts`, `PromoterDashboard.tsx` | A promoter can add a boxer to their own club. The API supports editing (`PUT /boxers/:id`), but there is no page for editing a boxer and no photo upload (only a `photoUrl` field). |
| 3 | Submitting a fight with its result (promoter) | ✅ | `fight.routes.ts`, `fight.service.ts`, "Vnesi dvoboj" tab | Validation of weight class, own club, suspended boxers and winner works. |
| 4 | Confirming a fight (admin) | ✅ | `PUT /fights/:id/confirm` and `/reject`, `AdminDashboard.tsx` | Confirmation and rejection with a reason work. |
| 5 | **(domain)** Automatic rating recalculation | ✅ | `rating.service.ts` (Elo, K = 32), `fight.service.ts` → `confirm` | Ratings and `RatingHistory` are updated in one transaction. |
| 6 | **(domain)** Rankings by weight class | ✅ | `ranking.service.ts` → `getRankings`, `Rankings.tsx` | Public, sorted by rating, paginated by 20. |
| 7 | **(domain)** Suggested opponents | ✅ | `ranking.service.ts` → `getSuggestedOpponents`, opponent drop-down in "Vnesi dvoboj" | Same weight class, only active boxers, sorted by rating difference, at most 10. |

Beyond the MVP, the project also implements: fight history and career record on the boxer profile (US-09), rating history as a table (US-08), public browsing without login (US-13), boxer search and filters (US-14), events and fight cards (US-15), and API endpoints for weight classes (US-10), suspensions (US-11) and clubs (US-12). Weight classes and suspensions have no pages yet, so they can only be used through the API.

**Conclusion:** all three domain-specific MVP functionalities (rating, rankings, opponent suggestions) and the core workflow (promoter submits → admin confirms → rating recalculated) are implemented and work. Two MVP functionalities are only partly done: user management after registration, and editing boxer profiles.

## 2. Review of five user stories

I reviewed the five user stories that form the core workflow of the MVP: US-01, US-03, US-04, US-05 and US-06. For each, every acceptance criterion from `05-uporabniske-zgodbe.md` was checked in the code and in the running application.

### US-01 – Registration and login

| Acceptance criterion | Status | Finding |
|---|---|---|
| Valid, unused email and a password with at least 8 characters | ✅ | Checked with zod; a used email returns 409. |
| Password stored as a bcrypt hash | ✅ | `bcrypt.hash` with 10 rounds. |
| User chooses `promoter` or `boxer`; only an admin can assign `admin` | ⚠️ | Registration accepts only `promoter` and `boxer`, but there is no function for an admin to assign the admin role. The only admin comes from the seed data. |
| Successful login returns a JWT with identity and role | ✅ | Token contains `id`, `email` and `role`, valid for 7 days. |
| Wrong email or password does not reveal which one is wrong | ✅ | Same message "Napačen e-poštni naslov ali geslo." in both cases. |

**Sufficient: mostly.** Registration and login work as described. A new user cannot do much after registering: a promoter has no club and a boxer has no linked profile.

### US-03 – Submitting a fight with its result

| Acceptance criterion | Status | Finding |
|---|---|---|
| Required fields: both boxers, date, event, method, winner (except for a draw) | ✅ | Required in the zod schema; winner required unless the result is `draw`, and forbidden for a draw. |
| Both boxers must be in the same weight class | ✅ | Otherwise 422 "Oba boksarja morata biti v isti kategoriji teže." The form only offers opponents from the same class. |
| New fight has status `pending` and does not affect the rating | ✅ | Default status `pending`; the rating changes only on confirmation. |
| Promoter can submit a fight only for a boxer of their own club | ✅ | At least one boxer must be from the promoter's club, otherwise 403. |
| The fight appears in the admin's list of pending fights | ✅ | `GET /fights/pending` and the admin dashboard. |

**Sufficient: yes.** Two gaps that the criteria do not mention but that can produce wrong data: the backend does not check that the winner is one of the two boxers, and it does not prevent the same boxer from being both boxer 1 and boxer 2.

### US-04 – Confirming or rejecting a fight

| Acceptance criterion | Status | Finding |
|---|---|---|
| Admin sees all `pending` fights ordered by submission time | ✅ | Ordered by `createdAt`. |
| The admin who confirms is not the promoter of the club involved | ✅ | Guaranteed by roles: only an admin can confirm, only a promoter can submit. |
| Confirmation sets `confirmed` and recalculates both ratings | ✅ | `confirm` in `fight.service.ts`. |
| Rejection sets `rejected`, keeps the ratings, and the promoter receives the reason | ⚠️ | Status and reason are saved (`rejectReason`), but the promoter has no page or message where the reason can be seen. |
| A confirmed fight cannot be edited; the admin can later cancel it and trigger a recalculation | ⚠️ | Confirmed fights cannot be edited or confirmed again (409). Cancelling a confirmed fight and recalculating the rankings is not implemented. |

**Sufficient: partly.** The main path (confirm or reject) works. Showing the rejection reason to the promoter and cancelling a confirmed fight are missing.

### US-05 – Automatic rating recalculation

| Acceptance criterion | Status | Finding |
|---|---|---|
| Recalculation happens only when a fight becomes `confirmed`, never manually | ✅ | Only called from `confirm`; there is no endpoint for changing a rating by hand. |
| Winner gains and loser loses points depending on the rating difference | ✅ | Elo: expected score `1 / (1 + 10^((Rb − Ra) / 400))`, change `K × (score − expected)`, K = 32. A bigger upset gives a bigger change. |
| A draw changes both ratings only slightly | ✅ | Score 0.5 for both. |
| Every recalculation creates a `RatingHistory` record with the rating before and after | ✅ | Two records per fight. |
| Recalculation and update run in one database transaction | ✅ | `prisma.$transaction`. The ratings are read before the transaction starts, which is a small risk only if two fights of the same boxer are confirmed at the same moment. |

**Sufficient: yes.** This is the core domain logic of the project and it matches the user story.

### US-06 – Rankings by weight class

| Acceptance criterion | Status | Finding |
|---|---|---|
| Available without login; all weight classes offered for selection | ✅ | Public endpoint; weight classes shown as tabs. |
| Boxers sorted by `current_rating`, highest first | ✅ | `orderBy: { currentRating: 'desc' }`. |
| Each row shows rank, name, club and rating | ✅ | Plus a status column. |
| Suspended boxers are visible and marked "suspendiran" | ✅ | Red label "Suspendiran". |
| Pagination with at most 20 boxers per page | ✅ | 20 per page. When a class has exactly 20 boxers, the "Naprej" button still opens an empty second page. |

**Sufficient: yes.**

### Summary

| User story | Sufficient |
|---|---|
| US-01 Registration and login | Mostly (4 of 5 criteria) |
| US-03 Submitting a fight | Yes (5 of 5) |
| US-04 Confirming or rejecting | Partly (3 of 5) |
| US-05 Rating recalculation | Yes (5 of 5) |
| US-06 Rankings | Yes (5 of 5) |

The implemented functionalities are sufficient for the core workflow of BoxRank. The open points concern what happens around that workflow: assigning clubs and roles, showing rejection reasons, and cancelling confirmed fights.

## 3. Other findings

- **Running locally:** the README has no instructions for starting the project, and the database migration and seed data have to be run by hand.
- **Docker Compose:** the frontend container uses the Vite proxy with the target `http://localhost:3000`. Inside the container, `localhost` is the frontend container itself, not the backend, so running the frontend in Docker cannot reach the API. Running the frontend with `npm run dev` on the computer works.
- **Frontend and backend address:** the frontend always calls `/api` through the Vite proxy; the `VITE_API_URL` variable in Docker Compose is not used. This has to be changed before the frontend can be deployed separately from the backend.
- **Tests:** the project has no automated tests yet, although the architecture document mentions Jest/Supertest.
- **Small UI detail:** the admin table has the German heading "Ereignis" instead of "Dogodek".
