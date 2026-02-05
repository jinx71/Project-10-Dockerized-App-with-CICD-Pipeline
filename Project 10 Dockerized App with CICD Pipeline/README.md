# Calibration Tracker API — Dockerised with CI/CD

> **Project 10 of 12** in my full-stack portfolio roadmap. A pharma-flavoured instrument calibration tracking API built with Node.js, Express and PostgreSQL — fully containerised with Docker and deployed automatically to AWS EC2 via a GitHub Actions CI/CD pipeline.

**Live Demo:** _coming soon_
**Screenshot:** _coming soon_

## Why This Project

In GMP-regulated manufacturing, every instrument must be calibrated on schedule — an overdue calibration is an audit finding. This API models that workflow: each instrument carries a calibration interval, and the API computes a live compliance status (`COMPLIANT`, `DUE_SOON`, `OVERDUE`) on every read.

The app is intentionally small. The focus of this project is the **DevOps layer**:

- Multi-stage Docker build running as a non-root user with a container `HEALTHCHECK`
- Docker Compose local environment (API + PostgreSQL) with health-gated startup
- Three-stage GitHub Actions pipeline: **test → build & push → deploy**
- Integration tests run against a real PostgreSQL service container in CI
- Images published to GitHub Container Registry (GHCR), deployed to AWS EC2 over SSH

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20, Express |
| Database | PostgreSQL 16 |
| Testing | Jest, Supertest |
| Containers | Docker (multi-stage), Docker Compose |
| CI/CD | GitHub Actions, GHCR |
| Hosting | AWS EC2 |

## API Endpoints

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Liveness + DB connectivity check |
| GET | `/api/instruments` | List instruments with computed status |
| GET | `/api/instruments/:id` | Get one instrument |
| POST | `/api/instruments` | Create an instrument |
| PUT | `/api/instruments/:id` | Update an instrument |
| DELETE | `/api/instruments/:id` | Delete an instrument |

All responses follow `{ success, data, message }`.

## Run Locally (Docker)

```bash
git clone https://github.com/jinx71/calibration-api.git
cd calibration-api
docker compose up --build
# API: http://localhost:3000/health
```

The Postgres schema is created automatically on first start via `db/init.sql`.

## Run Tests

Tests expect a reachable PostgreSQL instance (CI provides one as a service container):

```bash
# Start only the database
docker compose up -d db
DATABASE_URL=postgres://postgres:postgres@localhost:5432/calibration npm test
```

## CI/CD Pipeline

On every push to `main`:

1. **Test** — Jest integration suite runs against a disposable PostgreSQL 16 service container.
2. **Build & Push** — Multi-stage image is built and pushed to GHCR, tagged `latest` and with the commit SHA for traceable rollbacks.
3. **Deploy** — GitHub Actions SSHes into the EC2 instance, pulls the new image, and restarts the container with zero manual steps.

Pull requests run the test stage only — nothing ships from an unmerged branch.

### Required GitHub Secrets

| Secret | Purpose |
|---|---|
| `EC2_HOST` | Public IP / DNS of the EC2 instance |
| `EC2_USER` | SSH user (e.g. `ubuntu`) |
| `EC2_SSH_KEY` | Private key for the deploy user |

The EC2 instance needs Docker installed and an env file at `~/calibration-api.env` containing `DATABASE_URL`.

## Project Structure

```
├── .github/workflows/ci-cd.yml   # Test → build → deploy pipeline
├── src/
│   ├── server.js                 # Entry point
│   ├── app.js                    # Express app (importable for tests)
│   ├── db.js                     # pg connection pool
│   ├── routes/
│   └── controllers/
├── tests/                        # Jest + Supertest integration tests
├── db/init.sql                   # Schema, auto-applied by Compose
├── Dockerfile                    # Multi-stage, non-root, healthchecked
└── docker-compose.yml            # API + Postgres local environment
```

## Author

**Md. Sazed Ul Karim** — Full-Stack Developer with 8+ years of GMP pharmaceutical engineering experience (FDA / TGA / MHRA audits).
[GitHub](https://github.com/jinx71) · [LinkedIn](https://linkedin.com/in/sazed-ul-karim)
