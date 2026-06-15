# Backend Foundation Audit

**Project:** MVP Small Clinic  
**Date:** 2026-06-14  
**Auditor:** Senior Backend Architect  
**Scope:** Backend infrastructure only — no business logic review

---

## 1. Executive Summary

The backend is built from the [FastAPI Full-Stack Template](https://github.com/fastapi/full-stack-fastapi-template). This provides a **solid, production-tested foundation** with FastAPI, SQLModel (SQLAlchemy), Alembic, JWT auth, Docker Compose, and pytest already wired up.

**The foundation is ready for business logic development.** The template is well-structured, follows FastAPI best practices, and includes proper startup sequencing (DB health check → migrations → seed data).

**Key gaps to address before development:**

1. The existing `User` model is a generic auth entity — it needs a `role` field and a `Doctor` profile model.
2. The `.env` file still uses template defaults (`SECRET_KEY=changethis`, `PROJECT_NAME="Full Stack FastAPI Project"`).
3. No structured logging exists beyond basic `logging.basicConfig(level=logging.INFO)`.
4. The `User` model uses UUID PKs, but the earliest migration (`e2412789c190`) created integer PKs — the migration chain has already handled this migration, but the chain is fragile.
5. Connection pooling is using SQLModel defaults (no explicit pool configuration).

**Overall Readiness: 7.5/10** — safe to start implementing business logic after addressing P0 items.

---

## 2. Current Backend State

### What Already Exists

| Component           | Status     | Details                                              |
| ------------------- | ---------- | ---------------------------------------------------- |
| FastAPI app         | ✅ Working | `main.py` with CORS, Sentry, router registration     |
| Settings management | ✅ Working | Pydantic `BaseSettings` with `.env` support          |
| Database engine     | ✅ Working | SQLModel + psycopg3 via `create_engine`              |
| Session management  | ✅ Working | `get_db()` generator via `SessionDep`                |
| Alembic migrations  | ✅ Working | 5 migrations applied, autogenerate configured        |
| JWT auth            | ✅ Working | HS256, access + refresh token flow                   |
| Password hashing    | ✅ Working | Argon2 + bcrypt via `pwdlib`                         |
| User CRUD           | ✅ Working | Create, read, update, delete                         |
| Item CRUD           | ✅ Working | Generic item model (template artifact)               |
| Email sending       | ✅ Working | SMTP via `emails` library + Jinja2 templates         |
| Password reset      | ✅ Working | Token-based reset flow                               |
| Docker Compose      | ✅ Working | Backend, frontend, DB, Traefik, Adminer, Mailcatcher |
| Dockerfile          | ✅ Working | Multi-stage uv-based Python build                    |
| Health check        | ✅ Working | `GET /api/v1/utils/health-check/`                    |
| pytest setup        | ✅ Working | TestClient, fixtures, DB cleanup                     |
| Sentry integration  | ✅ Working | Optional, enabled in non-local environments          |
| Pre-start script    | ✅ Working | DB wait → migrations → seed data                     |

### What Exists But Needs Modification

| Component         | Issue                                                                         |
| ----------------- | ----------------------------------------------------------------------------- |
| `User` model      | Generic auth user — needs `role` field for doctor/admin distinction           |
| `Item` model      | Template artifact — will be replaced by clinic-specific models                |
| `crud.py`         | User/Item CRUD — will be replaced by service layer                            |
| `.env`            | Template defaults — `SECRET_KEY=changethis`, wrong `PROJECT_NAME`             |
| `routes/items.py` | Template artifact — will be removed                                           |
| `routes/users.py` | Template artifact — signup endpoint conflicts with "no patient accounts" rule |

---

## 3. Existing Components

### 3.1 FastAPI Foundation

**Structure:**

```
backend/
├── app/
│   ├── main.py                  # FastAPI app creation
│   ├── models.py                # SQLModel + Pydantic models
│   ├── crud.py                  # CRUD operations
│   ├── utils.py                 # Email, token utilities
│   ├── backend_pre_start.py     # DB readiness check
│   ├── initial_data.py          # Seed superuser
│   ├── tests_pre_start.py       # Test DB readiness
│   ├── core/
│   │   ├── config.py            # Pydantic Settings
│   │   ├── db.py                # Engine + init_db
│   │   └── security.py          # JWT + password hashing
│   ├── api/
│   │   ├── main.py              # API router aggregation
│   │   ├── deps.py              # Dependency injection
│   │   └── routes/
│   │       ├── login.py         # Auth endpoints
│   │       ├── users.py         # User management
│   │       ├── items.py         # Item CRUD (template)
│   │       ├── utils.py         # Health check, test email
│   │       └── private.py       # Private user creation (local only)
│   └── alembic/
│       ├── env.py               # Alembic env (autogenerate ready)
│       └── versions/            # 5 migration files
├── scripts/
│   ├── prestart.sh              # Startup sequence
│   ├── test.sh                  # Test runner
│   ├── tests-start.sh           # Test pre-start
│   ├── lint.sh                  # Lint runner
│   └── format.sh                # Formatter
├── tests/
│   ├── conftest.py              # Fixtures
│   ├── api/routes/              # API tests
│   ├── crud/                    # CRUD tests
│   ├── scripts/                 # Script tests
│   └── utils/                   # Test helpers
├── Dockerfile                   # Production container
├── pyproject.toml               # Dependencies + tool config
└── alembic.ini                  # Alembic config
```

**App creation** ([`backend/app/main.py`](backend/app/main.py:17)):

```python
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    generate_unique_id_function=custom_generate_unique_id,
)
```

**Router registration** ([`backend/app/api/main.py`](backend/app/api/main.py:6)):

```python
api_router = APIRouter()
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)
api_router.include_router(items.router)
```

**Dependency injection** ([`backend/app/api/deps.py`](backend/app/api/deps.py:21)):

```python
def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_db)]
```

**Verdict: ✅ Solid.** Standard FastAPI patterns. Clean separation of concerns. Ready for new route modules.

### 3.2 Settings Management

**File:** [`backend/app/core/config.py`](backend/app/core/config.py:26)

- Uses `pydantic-settings` with `.env` file support
- Computed fields for `SQLALCHEMY_DATABASE_URI` and `all_cors_origins`
- Validates secrets aren't left as `changethis` in non-local environments
- CORS parsing supports both comma-separated strings and JSON arrays

**Verdict: ✅ Excellent.** Production-grade settings management.

### 3.3 Database Layer

**Engine** ([`backend/app/core/db.py`](backend/app/core/db.py:7)):

```python
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))
```

**Session** ([`backend/app/api/deps.py`](backend/app/api/deps.py:21)):

```python
def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
```

**Verdict: ✅ Functional but minimal.** No explicit pool configuration — uses SQLModel defaults. For a small clinic MVP with low concurrency, this is acceptable. No connection pooling issues expected at MVP scale.

### 3.4 Alembic

**File:** [`backend/app/alembic/env.py`](backend/app/alembic/env.py:1)

- Autogenerate configured with `target_metadata = SQLModel.metadata`
- Uses `compare_type=True` for column type change detection
- Reads database URL from settings (not hardcoded)
- Both online and offline modes configured

**Migration chain:**

1. `e2412789c190` — Initialize models (integer PKs)
2. `fe56fa70289e` — Add `created_at` to user and item
3. `d98dd8ec85a3` — Replace integer PKs with UUIDs
4. `9c0a54914c78` — Add max length for string varchar
5. `1a31ce608336` — Add cascade delete relationships

**Verdict: ✅ Good.** Properly configured. The migration chain has already handled the integer→UUID transition. Autogenerate is ready for new models.

### 3.5 Authentication

**JWT** ([`backend/app/core/security.py`](backend/app/core/security.py:22)):

```python
def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
```

**Password hashing** ([`backend/app/core/security.py`](backend/app/core/security.py:11)):

```python
password_hash = PasswordHash((Argon2Hasher(), BcryptHasher()))
```

**Login flow** ([`backend/app/api/routes/login.py`](backend/app/api/routes/login.py:23)):

- `POST /login/access-token` — OAuth2 form-based login
- `POST /login/test-token` — Token validation
- Password reset with email recovery

**Token validation** ([`backend/app/api/deps.py`](backend/app/api/deps.py:30)):

```python
def get_current_user(session: SessionDep, token: TokenDep) -> User:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
    token_data = TokenPayload(**payload)
    user = session.get(User, token_data.sub)
    ...
```

**Security features:**

- ✅ Argon2 + bcrypt password hashing (industry standard)
- ✅ Timing attack prevention via dummy hash when user not found
- ✅ Password hash rehashing on algorithm upgrade
- ✅ Token expiry (8 days default)
- ✅ Inactive user check
- ✅ Password reset token with expiry

**Verdict: ✅ Strong.** The auth foundation is production-quality. Only missing piece is role-based access (doctor vs admin), which is a business logic concern.

### 3.6 Docker Infrastructure

**Dockerfile** ([`backend/Dockerfile`](backend/Dockerfile:1)):

- Python 3.10 base image
- `uv` for fast dependency installation
- Bytecode compilation enabled
- Cache mounts for faster rebuilds
- 4 workers via `fastapi run --workers 4`

**Docker Compose** ([`compose.yml`](compose.yml:1)):

- PostgreSQL 18 with health check
- Backend with health check (`/api/v1/utils/health-check/`)
- Prestart service (DB wait → migrations → seed)
- Traefik reverse proxy (HTTP → HTTPS, Let's Encrypt)
- Adminer (DB admin UI)
- Frontend container
- Mailcatcher for email testing (override)

**Startup sequence:**

1. DB container starts (health check: `pg_isready`)
2. Prestart container: `backend_pre_start.py` (retry DB connection) → `alembic upgrade head` → `initial_data.py` (seed superuser)
3. Backend container starts after prestart completes
4. Health check confirms app is responding

**Verdict: ✅ Excellent.** Production-ready Docker setup with proper health checks, dependency ordering, and zero-downtime startup.

### 3.7 Logging

**Current state** ([`backend/app/utils.py`](backend/app/utils.py:15)):

```python
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

Same pattern in [`backend_pre_start.py`](backend/app/backend_pre_start.py:9) and [`tests_pre_start.py`](backend/app/tests_pre_start.py:9).

**Verdict: ⚠️ Minimal.** Basic `logging.basicConfig` with INFO level. No structured logging, no request ID tracking, no middleware for automatic request logging. For MVP this is acceptable but should be improved minimally.

### 3.8 Testing Foundation

**pytest config** ([`backend/pyproject.toml`](backend/pyproject.toml:69)):

```toml
[tool.coverage.run]
source = ["app"]
dynamic_context = "test_function"
```

**Fixtures** ([`backend/tests/conftest.py`](backend/tests/conftest.py:15)):

- `db` — Session-scoped DB session with cleanup
- `client` — Module-scoped TestClient
- `superuser_token_headers` — Module-scoped auth headers
- `normal_user_token_headers` — Module-scoped user auth headers

**Test structure:**

```
tests/
├── conftest.py
├── api/routes/
│   ├── test_items.py
│   ├── test_login.py
│   ├── test_private.py
│   └── test_users.py
├── crud/
│   └── test_user.py
├── scripts/
│   ├── test_backend_pre_start.py
│   └── test_test_pre_start.py
└── utils/
    ├── item.py
    ├── user.py
    └── utils.py
```

**Verdict: ✅ Good.** Solid test foundation with proper fixtures, test helpers, and coverage config. Tests are module-scoped for performance.

---

## 4. Missing Components

### 4.1 Infrastructure Gaps

| Component                     | Priority | Reason                                                                                                                                |
| ----------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Connection pool config        | P1       | No explicit `pool_size` or `max_overflow` — using SQLModel defaults. For MVP scale this is fine, but should be configured explicitly. |
| Structured logging middleware | P2       | No request logging middleware. Makes debugging harder.                                                                                |
| CORS hardening for production | P2       | Currently allows all origins in local mode. Fine for MVP but needs review before production.                                          |

### 4.2 Pre-Development Setup Gaps

| Component                            | Priority | Reason                                                                               |
| ------------------------------------ | -------- | ------------------------------------------------------------------------------------ |
| Update `.env` defaults               | P0       | `SECRET_KEY=changethis`, `PROJECT_NAME="Full Stack FastAPI Project"` must be changed |
| Remove template artifacts            | P1       | `Item` model, `items.py` routes, `users.py` signup endpoint are template leftovers   |
| Add `role` field to `User`           | P0       | Required for doctor vs admin distinction                                             |
| Create `Doctor` model                | P0       | Core business entity — needed before any feature work                                |
| Create `Doctor` CRUD/service         | P0       | Needed by auth, booking, availability modules                                        |
| Add doctor-specific auth dependency  | P0       | `get_current_doctor()` — separate from `get_current_user()`                          |
| Configure `uv.lock`                  | P1       | Dockerfile uses `uv sync --frozen` but `uv.lock` may not be generated                |
| Add `APP_ENV` or `LOG_LEVEL` setting | P2       | For runtime log level control                                                        |

---

## 5. Risks

### 5.1 Architectural Risks

| Risk                                                                                                                                                                                                      | Severity | Mitigation                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Template lock-in** — The project is built from a generic template. The `User`/`Item` models and routes may influence design decisions toward the template's patterns rather than clinic-specific needs. | Low      | Already identified. The architecture doc (`docs/02_ARCHITECTURE.md`) defines clinic-specific modules. Follow that plan. |
| **Monolith scalability** — If the clinic grows significantly, the single backend container may need splitting.                                                                                            | Low      | Not an MVP concern. Monolith is correct for this stage.                                                                 |
| **SQLModel limitations** — SQLModel is a thin wrapper over SQLAlchemy. Complex queries may require dropping down to raw SQLAlchemy.                                                                       | Low      | Acceptable for MVP. SQLModel handles 90% of use cases.                                                                  |

### 5.2 Technical Risks

| Risk                                                                                                                                                                                                                    | Severity | Mitigation                                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Migration chain fragility** — The existing 5 migrations include an integer→UUID PK migration (`d98dd8ec85a3`). If developers need to reset and recreate migrations from scratch, the chain must be handled carefully. | Medium   | Document the migration reset procedure. Consider squashing migrations before production if the chain grows.                                  |
| **No DB connection pooling config** — SQLModel's `create_engine` defaults may not be optimal. Under concurrent load, connections could exhaust.                                                                         | Low      | For a small clinic MVP, concurrent users will be < 50. Monitor and add pool config if needed.                                                |
| **Sentry dependency** — Sentry SDK is a hard dependency in `pyproject.toml`. If not configured, it's a no-op, but it's still installed.                                                                                 | Low      | Acceptable. Sentry is valuable even for MVP.                                                                                                 |
| **`SECRET_KEY=changethis` in `.env`** — If deployed without changing, JWT tokens can be forged.                                                                                                                         | **High** | The settings validator catches this in non-local environments. But local dev with `changethis` is risky if someone exposes the local server. |

### 5.3 Deployment Risks

| Risk                                                                                                                                        | Severity | Mitigation                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------ |
| **Traefik complexity** — The Traefik setup with Let's Encrypt, multiple networks, and middleware is over-engineered for a small clinic MVP. | Low      | It works. Don't change it unless it causes issues.                                   |
| **PostgreSQL 18** — Very new PostgreSQL version. May have compatibility issues with some tools.                                             | Low      | psycopg3 supports it. If issues arise, pin to PostgreSQL 16.                         |
| **No backup strategy** — No volume backup or DB dump mechanism in compose.                                                                  | Medium   | Add a simple `pg_dump` cron or script before production. Not needed for development. |

---

## 6. Recommended Fixes

### P0 — Must Fix Before Development

| #   | Fix                                          | File(s)                           | Reason                                                      |
| --- | -------------------------------------------- | --------------------------------- | ----------------------------------------------------------- |
| 1   | **Generate real `SECRET_KEY`**               | `.env`                            | Security — current value is `changethis`                    |
| 2   | **Update `PROJECT_NAME`**                    | `.env`                            | Cosmetic but affects API docs title                         |
| 3   | **Add `role` field to `User` model**         | `backend/app/models.py`           | Required for doctor/admin authorization                     |
| 4   | **Create `Doctor` model**                    | `backend/app/models.py`           | Core business entity — needed by all features               |
| 5   | **Create `get_current_doctor()` dependency** | `backend/app/api/deps.py`         | Required for doctor-only endpoints                          |
| 6   | **Remove public signup endpoint**            | `backend/app/api/routes/users.py` | MVP V1 has no patient accounts — only admin creates doctors |

### P1 — Should Fix Soon

| #   | Fix                                        | File(s)                                                    | Reason                                                      |
| --- | ------------------------------------------ | ---------------------------------------------------------- | ----------------------------------------------------------- |
| 7   | **Remove `Item` model and routes**         | `backend/app/models.py`, `backend/app/api/routes/items.py` | Template artifact — not needed for clinic                   |
| 8   | **Remove `Item` from CRUD**                | `backend/app/crud.py`                                      | Template artifact                                           |
| 9   | **Add explicit connection pool config**    | `backend/app/core/db.py`                                   | Production hardening — set `pool_size=5`, `max_overflow=10` |
| 10  | **Generate `uv.lock`**                     | Project root                                               | Dockerfile uses `--frozen` flag — lock file must exist      |
| 11  | **Clean up test files for removed models** | `backend/tests/`                                           | Remove Item-related tests                                   |
| 12  | **Add `is_doctor` helper on `User`**       | `backend/app/models.py`                                    | Convenience property for role checks                        |

### P2 — Can Wait

| #   | Fix                                     | File(s)                           | Reason                                               |
| --- | --------------------------------------- | --------------------------------- | ---------------------------------------------------- |
| 13  | **Add request logging middleware**      | `backend/app/main.py`             | Helpful for debugging but not critical for MVP       |
| 14  | **Add `LOG_LEVEL` to settings**         | `backend/app/core/config.py`      | Runtime log level control                            |
| 15  | **Squash migrations before production** | `backend/app/alembic/versions/`   | Clean up migration history                           |
| 16  | **Add DB backup script**                | `backend/scripts/`                | Production readiness                                 |
| 17  | **Add health check DB query**           | `backend/app/api/routes/utils.py` | Current health check returns `True` without DB check |

---

## 7. Readiness Score

| Category              | Score      | Notes                                                                     |
| --------------------- | ---------- | ------------------------------------------------------------------------- |
| FastAPI Foundation    | 9/10       | Solid structure, settings, DI. Just needs template cleanup.               |
| Database Layer        | 7/10       | Works but no explicit pool config. SQLModel is fine for MVP.              |
| Alembic               | 8/10       | Properly configured. Migration chain is intact but fragile.               |
| Authentication        | 8/10       | Strong JWT + Argon2. Missing role-based access for doctors.               |
| Docker                | 9/10       | Production-ready. Health checks, dependency ordering, Traefik.            |
| Logging               | 4/10       | Basic `logging.basicConfig`. No structured logging or request middleware. |
| Testing               | 8/10       | Good pytest setup with fixtures. Tests exist for template models.         |
| **Overall Readiness** | **7.5/10** | **Safe to start development after P0 items.**                             |

---

## 8. Next Development Step

### Recommended: Implement Doctor Model & Auth

**Rationale:** Every feature in the backlog (booking, availability, dashboard, AI assistant) depends on the `Doctor` entity and doctor-specific authentication. Without this, no other work can proceed.

**Scope:**

1. Add `role` field to `User` model (enum: `admin`, `doctor`)
2. Create `Doctor` model with profile fields (specialty, bio, photo, etc.)
3. Create `DoctorCreate`/`DoctorPublic` Pydantic schemas
4. Create `get_current_doctor()` dependency that validates role
5. Create doctor CRUD (admin creates doctors, doctors read their own profile)
6. Add Alembic migration for new models
7. Remove `Item` model and related code
8. Remove public signup endpoint
9. Update `.env` with real values
10. Generate `uv.lock`

**Estimated effort:** 1-2 days for a senior developer.

---

## Appendix A: File Reference

| File                                                                   | Purpose                    |
| ---------------------------------------------------------------------- | -------------------------- |
| [`backend/app/main.py`](backend/app/main.py)                           | FastAPI app entry point    |
| [`backend/app/core/config.py`](backend/app/core/config.py)             | Settings management        |
| [`backend/app/core/db.py`](backend/app/core/db.py)                     | Database engine + init     |
| [`backend/app/core/security.py`](backend/app/core/security.py)         | JWT + password hashing     |
| [`backend/app/api/deps.py`](backend/app/api/deps.py)                   | Dependency injection       |
| [`backend/app/api/main.py`](backend/app/api/main.py)                   | Router aggregation         |
| [`backend/app/api/routes/login.py`](backend/app/api/routes/login.py)   | Auth endpoints             |
| [`backend/app/api/routes/users.py`](backend/app/api/routes/users.py)   | User management            |
| [`backend/app/api/routes/items.py`](backend/app/api/routes/items.py)   | Template artifact          |
| [`backend/app/api/routes/utils.py`](backend/app/api/routes/utils.py)   | Health check, test email   |
| [`backend/app/models.py`](backend/app/models.py)                       | SQLModel + Pydantic models |
| [`backend/app/crud.py`](backend/app/crud.py)                           | CRUD operations            |
| [`backend/app/utils.py`](backend/app/utils.py)                         | Email, token utilities     |
| [`backend/app/backend_pre_start.py`](backend/app/backend_pre_start.py) | DB readiness check         |
| [`backend/app/initial_data.py`](backend/app/initial_data.py)           | Seed superuser             |
| [`backend/Dockerfile`](backend/Dockerfile)                             | Production container       |
| [`compose.yml`](compose.yml)                                           | Docker Compose config      |
| [`compose.override.yml`](compose.override.yml)                         | Local dev overrides        |
| [`.env`](.env)                                                         | Environment variables      |
| [`backend/pyproject.toml`](backend/pyproject.toml)                     | Dependencies + tool config |
| [`backend/alembic.ini`](backend/alembic.ini)                           | Alembic config             |
| [`backend/app/alembic/env.py`](backend/app/alembic/env.py)             | Alembic environment        |
| [`backend/scripts/prestart.sh`](backend/scripts/prestart.sh)           | Startup sequence           |
| [`backend/tests/conftest.py`](backend/tests/conftest.py)               | Test fixtures              |
