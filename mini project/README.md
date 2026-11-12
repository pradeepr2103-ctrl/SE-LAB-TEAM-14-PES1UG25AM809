# Campus Wellness Portal (CWP)

The Campus Wellness Portal is a mental wellness application that provides stress assessments (PSS-10), daily mood check-ins and mood tracking for students. Counselors can view student assessment results, while administrators manage users and roles.

**Technology Stack:** Node.js 20+ · Express.js · SQLite (better-sqlite3) · React 18 · Vite 5 · GitHub Actions CI

---

## 1. Prerequisites

Install the following software before setting up the project:

- Node.js version 20 or later.
- npm (included with Node.js).
- Git.
- A modern web browser.
- Visual Studio Code (recommended).

Verify the installations:

```bash
node --version
npm --version
git --version
```

## 2. Clone the Repository

Clone the team's GitHub repository:

```bash
git clone https://github.com/pradeepr2103-ctrl/SE-LAB-TEAM-14-PES1UG25AM809.git
```

Navigate into the mini-project directory:

```bash
cd "SE-LAB-TEAM-14-PES1UG25AM809/mini project"
```

## 3. Backend Setup

Open a terminal inside the `mini project` directory.

Navigate to the server:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Initialize and seed the SQLite database with demo users:

```bash
npm run seed
```

Start the backend:

```bash
npm start
```

The backend API runs at:

`http://localhost:4000`

### Verify the Backend

Open this URL in your browser:

`http://localhost:4000/api/health`

Expected response:

```json
{
  "status": "ok"
}
```

## 4. Frontend Setup

Keep the backend running.

Open a second terminal and navigate to the `mini project` directory, then enter the client folder:

```bash
cd "SE-LAB-TEAM-14-PES1UG25AM809/mini project/client"
```

If your terminal is already inside `mini project`, simply run:

```bash
cd client
```

Install frontend dependencies:

```bash
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend normally runs at:

`http://localhost:5173`

The Vite development server proxies `/api` requests to the backend at `http://localhost:4000`.

**Important:** Keep both the backend and frontend terminals running while using the application.

## 5. Environment Configuration

The backend supports the following environment variables:

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `4000` |
| `DB_FILE` | SQLite database file location | `server/data/app.db` |
| `JWT_SECRET` | Secret used for signing authentication tokens | Development fallback |
| `SEED_PASSWORD` | Password assigned to seeded demo users | `Passw0rd!` |
| `MAX_LOGIN_ATTEMPTS` | Maximum failed login attempts | `5` |
| `LOCK_MINUTES` | Account lockout duration | `15` minutes |

The project reads these values directly through `process.env`. It does not currently load `.env` files automatically.

### Example: Windows PowerShell

Set the variables before starting the backend:

```powershell
$env:PORT="4000"
$env:JWT_SECRET="replace-with-a-secure-secret"
$env:SEED_PASSWORD="replace-with-a-demo-password"
$env:MAX_LOGIN_ATTEMPTS="5"
$env:LOCK_MINUTES="15"
```

Then seed the database and start the server:

```powershell
npm run seed
npm start
```

For Linux/macOS, use `export VARIABLE=value` instead.

**Note:** Use the same `SEED_PASSWORD` when seeding and signing in. These are development configuration examples; never commit real secrets to GitHub.

## 6. Demo Accounts

The seed script creates the following accounts by default:

| Role | Email | Default Password |
|---|---|---|
| Student | student@pes.edu | Passw0rd! |
| Student | student2@pes.edu | Passw0rd! |
| Counselor | counselor@pes.edu | Passw0rd! |
| Admin | admin@pes.edu | Passw0rd! |

These credentials are intended for local development and demonstration only.

## 7. Running Tests

Navigate to the backend directory:

```bash
cd server
```

Run the automated backend tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run coverage
```

The backend uses Node.js's built-in test runner.

### Frontend Production Build

Navigate to the client directory:

```bash
cd client
```

Build the frontend:

```bash
npm run build
```

The production build is generated in the `dist/` directory.

## 8. Troubleshooting

| Problem | Suggested solution |
|---|---|
| Node.js version error | Install Node.js 20 or later. |
| Dependency installation fails | Check your internet connection and run `npm install` again. |
| Port 4000 is already in use | Stop the process using the port or configure another `PORT`. |
| Frontend cannot reach backend | Verify that the backend is running on port 4000. |
| Database errors | Ensure the server can create and write to its data directory. |
| Login fails | Verify the demo credentials and `SEED_PASSWORD`. |
| Frontend build fails | Reinstall dependencies and run `npm run build`. |

## 9. Deployment and Security Notes

The instructions above describe local development setup.

Before production deployment:

- Configure a strong, unique `JWT_SECRET`.
- Replace default demo passwords.
- Store secrets in the deployment platform's environment configuration.
- Use HTTPS.
- Configure persistent database storage and backups.
- Restrict database and server access.
- Avoid exposing passwords, tokens or sensitive user information in logs.

The application uses SQLite by default. Production deployments must ensure that the database is stored on persistent storage.

## 10. Project Structure

```text
mini project/
├── DOCS/       Documentation and project reports
├── client/     React frontend and Vite configuration
├── server/     Express backend and SQLite database
│   ├── src/
│   │   ├── routes/
│   │   ├── app.js
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── schema.sql
│   │   └── seed.js
│   └── test/   Automated backend tests
├── videos/     Project demonstration videos
└── README.md   Setup and deployment guide
```

## 11. Development Workflow

1. Create a separate feature branch for each Jira task.
2. Include the Jira task ID in the branch name and Pull Request title.
3. Commit and push changes to the feature branch.
4. Create a Pull Request targeting `main`.
5. Ensure required CI checks pass.
6. Get the Pull Request reviewed and merged by the authorized team member.
7. Move the Jira task to **Done** only after merging.

## 12. Repository

**GitHub:** https://github.com/pradeepr2103-ctrl/SE-LAB-TEAM-14-PES1UG25AM809
