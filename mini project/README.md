# Campus Wellness Portal (CWP)

Stress assessment (PSS-10) and daily mood check-in for students; counselors see results.
Stack: Node 20 + Express + SQLite (better-sqlite3) · React (Vite) · GitHub Actions CI.

## Run
```bash
# server (port 4000)
cd server && npm install && npm run seed && npm start

# client (port 5173, proxies /api to 4000)
cd client && npm install && npm run dev
```

## Test
```bash
cd server && npm test
cd client && npm run build
```

## Demo accounts (from `npm run seed`)
| Role | Email | Password |
|---|---|---|
| student | student@pes.edu | Passw0rd! |
| counselor | counselor@pes.edu | Passw0rd! |
| admin | admin@pes.edu | Passw0rd! |

## Workflow (Jira key in every branch/PR)
1. Branch: `CWP-7-login` · 2. PR with the Jira key in the title · 3. CI green + merged by repo owner · 4. Only then move the card to **Done**.

## Layout
```
server/   Express API, SQLite schema, seed, tests
client/   React UI
docs/     SRS, SAD, Test Plan, deviations.md
videos/   sprint1.mp4, sprint2.mp4
.github/  CI workflow, PR template
```
