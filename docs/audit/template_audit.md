# AUDIT REPORT — FastAPI Full Stack Template → Clinic MVP

## 1. Executive Summary

This project is based on the official [FastAPI Full Stack Template](https://github.com/fastapi/full-stack-fastapi-template). It is a **multi-user SaaS template** designed for generic CRUD applications with superuser/admin roles, self-registration, email workflows, and full Docker/Traefik deployment.

**For a Small Clinic MVP** (1–2 doctors, AI-powered booking, no multi-tenant, no patient registration), the template is **over-engineered by approximately 60%**. However, its **core architecture** (FastAPI + SQLModel + JWT auth + React + shadcn/ui) is **highly reusable**.

**Key finding:** The template's `User` + `Item` model pair is a generic "owner has resources" pattern. For the clinic, `User` maps to `Admin/Doctor` and `Item` maps to `Appointment/PatientRecord`. The scaffolding (auth, CRUD patterns, frontend table components) is directly reusable.

---

## 2. KEEP — Reuse Unchanged or Near-Unchanged

### 2.1 Backend Core Infrastructure

| Module                         | File(s)                                                                   | Reason                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`app/core/config.py`**       | [`backend/app/core/config.py`](../backend/app/core/config.py)             | Pydantic Settings pattern is excellent. Keep the entire structure. Only need to add clinic-specific settings (e.g., `CLINIC_NAME`, `BOOKING_DURATION_MINUTES`). |
| **`app/core/security.py`**     | [`backend/app/core/security.py`](../backend/app/core/security.py)         | JWT creation, Argon2+bcrypt password hashing. Production-grade. Keep unchanged.                                                                                 |
| **`app/core/db.py`**           | [`backend/app/core/db.py`](../backend/app/core/db.py)                     | SQLModel engine + `init_db()` for first superuser seeding. Keep unchanged.                                                                                      |
| **`app/api/deps.py`**          | [`backend/app/api/deps.py`](../backend/app/api/deps.py)                   | `get_db()`, `get_current_user()`, `CurrentUser`, `SessionDep`. Core dependency injection. Keep unchanged.                                                       |
| **`app/main.py`**              | [`backend/app/main.py`](../backend/app/main.py)                           | FastAPI app factory, CORS, Sentry init. Keep. Remove Sentry for MVP (optional).                                                                                 |
| **`app/backend_pre_start.py`** | [`backend/app/backend_pre_start.py`](../backend/app/backend_pre_start.py) | DB readiness check with retry. Keep unchanged.                                                                                                                  |
| **`app/initial_data.py`**      | [`backend/app/initial_data.py`](../backend/app/initial_data.py)           | Seeds first superuser. Keep unchanged.                                                                                                                          |
| **`app/tests_pre_start.py`**   | [`backend/app/tests_pre_start.py`](../backend/app/tests_pre_start.py)     | Test DB readiness check. Keep unchanged.                                                                                                                        |

### 2.2 Authentication (Core Flow)

| Module              | File(s)                                                                 | Reason                                                                                                                                    |
| ------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Login route**     | [`backend/app/api/routes/login.py`](../backend/app/api/routes/login.py) | JWT token endpoint (`/login/access-token`), test-token endpoint. Keep. Password recovery endpoints can be kept or removed (see SIMPLIFY). |
| **JWT token model** | [`backend/app/models.py`](../backend/app/models.py) lines 117–125       | `Token`, `TokenPayload` models. Keep unchanged.                                                                                           |

### 2.3 Frontend Foundation

| Module                        | File(s)                                                                                                                                                                                                      | Reason                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| **UI component library**      | [`frontend/src/components/ui/`](../frontend/src/components/ui/)                                                                                                                                              | shadcn/ui components (button, dialog, form, input, table, etc.). Keep all — they are generic and reusable. |
| **Theme provider**            | [`frontend/src/components/theme-provider.tsx`](../frontend/src/components/theme-provider.tsx)                                                                                                                | Dark/light mode. Keep unchanged.                                                                           |
| **Appearance switcher**       | [`frontend/src/components/Common/Appearance.tsx`](../frontend/src/components/Common/Appearance.tsx)                                                                                                          | Theme toggle. Keep unchanged.                                                                              |
| **Error/NotFound components** | [`frontend/src/components/Common/ErrorComponent.tsx`](../frontend/src/components/Common/ErrorComponent.tsx), [`frontend/src/components/Common/NotFound.tsx`](../frontend/src/components/Common/NotFound.tsx) | Keep unchanged.                                                                                            |
| **AuthLayout**                | [`frontend/src/components/Common/AuthLayout.tsx`](../frontend/src/components/Common/AuthLayout.tsx)                                                                                                          | Login/signup layout. Keep, rebrand logo.                                                                   |
| **Footer**                    | [`frontend/src/components/Common/Footer.tsx`](../frontend/src/components/Common/Footer.tsx)                                                                                                                  | Keep, update text.                                                                                         |
| **Logo**                      | [`frontend/src/components/Common/Logo.tsx`](../frontend/src/components/Common/Logo.tsx)                                                                                                                      | Keep, replace with clinic logo.                                                                            |
| **DataTable**                 | [`frontend/src/components/Common/DataTable.tsx`](../frontend/src/components/Common/DataTable.tsx)                                                                                                            | Generic paginated table. Keep unchanged — reusable for appointments list.                                  |
| **Sidebar components**        | [`frontend/src/components/Sidebar/`](../frontend/src/components/Sidebar/)                                                                                                                                    | AppSidebar, Main, User. Keep — just update nav items.                                                      |
| **useAuth hook**              | [`frontend/src/hooks/useAuth.ts`](../frontend/src/hooks/useAuth.ts)                                                                                                                                          | Login/logout/signup mutations. Keep.                                                                       |
| **useCustomToast**            | [`frontend/src/hooks/useCustomToast.ts`](../frontend/src/hooks/useCustomToast.ts)                                                                                                                            | Toast notifications. Keep unchanged.                                                                       |
| **Client SDK**                | [`frontend/src/client/`](../frontend/src/client/)                                                                                                                                                            | Auto-generated OpenAPI client. Keep — regenerate for new API.                                              |
| **Vite config**               | [`frontend/vite.config.ts`](../frontend/vite.config.ts)                                                                                                                                                      | Keep unchanged.                                                                                            |
| **Main entry**                | [`frontend/src/main.tsx`](../frontend/src/main.tsx)                                                                                                                                                          | React root, QueryClient, Router. Keep.                                                                     |
| **Root route**                | [`frontend/src/routes/__root.tsx`](../frontend/src/routes/__root.tsx)                                                                                                                                        | Keep unchanged.                                                                                            |
| **Layout route**              | [`frontend/src/routes/_layout.tsx`](../frontend/src/routes/_layout.tsx)                                                                                                                                      | Authenticated layout with sidebar. Keep.                                                                   |

### 2.4 Docker & Deployment

| Module                  | File(s)                                                         | Reason                                        |
| ----------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| **Backend Dockerfile**  | [`backend/Dockerfile`](../backend/Dockerfile)                   | Multi-stage uv-based build. Keep unchanged.   |
| **Frontend Dockerfile** | [`frontend/Dockerfile`](../frontend/Dockerfile)                 | Bun + Nginx multi-stage. Keep unchanged.      |
| **Alembic env.py**      | [`backend/app/alembic/env.py`](../backend/app/alembic/env.py)   | Auto-migration configuration. Keep unchanged. |
| **Alembic ini**         | [`backend/alembic.ini`](../backend/alembic.ini)                 | Keep unchanged.                               |
| **Prestart script**     | [`backend/scripts/prestart.sh`](../backend/scripts/prestart.sh) | DB check → migrate → seed. Keep unchanged.    |

---

## 3. REMOVE — Delete Entirely

### 3.1 Backend — Remove

| Module                                     | File(s)                                                                             | Reason                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **`app/api/routes/items.py`**              | [`backend/app/api/routes/items.py`](../backend/app/api/routes/items.py)             | Generic "Item" CRUD. The clinic has no concept of "items". Replace with appointment/patient routes.      |
| **`app/api/routes/private.py`**            | [`backend/app/api/routes/private.py`](../backend/app/api/routes/private.py)         | Local-only private user creation endpoint. Not needed — admin creates users via admin panel.             |
| **`app/api/routes/utils.py`** (test-email) | [`backend/app/api/routes/utils.py`](../backend/app/api/routes/utils.py) lines 11–27 | Test email endpoint. Remove for MVP. Keep `/health-check/`.                                              |
| **`app/crud.py`** (item functions)         | [`backend/app/crud.py`](../backend/app/crud.py) lines 63–68                         | `create_item()` function. Remove. Keep user CRUD functions.                                              |
| **`app/models.py`** (Item models)          | [`backend/app/models.py`](../backend/app/models.py) lines 70–108                    | `ItemBase`, `ItemCreate`, `ItemUpdate`, `Item`, `ItemPublic`, `ItemsPublic`. Remove entirely.            |
| **`app/email-templates/`**                 | [`backend/app/email-templates/`](../backend/app/email-templates/)                   | MJML email templates for new account, reset password, test email. Remove for MVP unless email is needed. |
| **`backend/tests/`** (item tests)          | [`backend/tests/utils/item.py`](../backend/tests/utils/item.py)                     | Item test utilities. Remove.                                                                             |
| **Sentry**                                 | [`backend/app/main.py`](../backend/app/main.py) line 1, 14–15                       | Remove Sentry dependency for MVP. Can add later.                                                         |
| **`pyproject.toml`** extras                | [`backend/pyproject.toml`](../backend/pyproject.toml)                               | Remove `sentry-sdk` from dependencies. Keep everything else.                                             |

### 3.2 Frontend — Remove

| Module                             | File(s)                                                                                                                                                                                                                                                | Reason                                                                                |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Items page**                     | [`frontend/src/routes/_layout/items.tsx`](../frontend/src/routes/_layout/items.tsx)                                                                                                                                                                    | Generic items list. Replace with appointments page.                                   |
| **Items components**               | [`frontend/src/components/Items/`](../frontend/src/components/Items/)                                                                                                                                                                                  | `AddItem`, `EditItem`, `DeleteItem`, `columns`, `ItemActionsMenu`. Remove entirely.   |
| **Pending items**                  | [`frontend/src/components/Pending/PendingItems.tsx`](../frontend/src/components/Pending/PendingItems.tsx)                                                                                                                                              | Remove.                                                                               |
| **Admin page**                     | [`frontend/src/routes/_layout/admin.tsx`](../frontend/src/routes/_layout/admin.tsx)                                                                                                                                                                    | User management admin panel. Remove for MVP — only 1–2 doctors, no need for admin UI. |
| **Admin components**               | [`frontend/src/components/Admin/`](../frontend/src/components/Admin/)                                                                                                                                                                                  | `AddUser`, `EditUser`, `DeleteUser`, `columns`, `UserActionsMenu`. Remove entirely.   |
| **Pending users**                  | [`frontend/src/components/Pending/PendingUsers.tsx`](../frontend/src/components/Pending/PendingUsers.tsx)                                                                                                                                              | Remove.                                                                               |
| **Signup page**                    | [`frontend/src/routes/signup.tsx`](../frontend/src/routes/signup.tsx)                                                                                                                                                                                  | No patient self-registration. Remove.                                                 |
| **Password recovery pages**        | [`frontend/src/routes/recover-password.tsx`](../frontend/src/routes/recover-password.tsx), [`frontend/src/routes/reset-password.tsx`](../frontend/src/routes/reset-password.tsx)                                                                       | Remove for MVP unless email is configured.                                            |
| **User Settings — Delete Account** | [`frontend/src/components/UserSettings/DeleteAccount.tsx`](../frontend/src/components/UserSettings/DeleteAccount.tsx), [`frontend/src/components/UserSettings/DeleteConfirmation.tsx`](../frontend/src/components/UserSettings/DeleteConfirmation.tsx) | Remove — doctors shouldn't delete themselves.                                         |
| **Playwright tests**               | [`frontend/tests/`](../frontend/tests/)                                                                                                                                                                                                                | All E2E tests are template-specific. Remove.                                          |
| **FastAPI branding assets**        | [`frontend/public/assets/images/`](../frontend/public/assets/images/)                                                                                                                                                                                  | Replace with clinic branding.                                                         |
| **`nginx-backend-not-found.conf`** | [`frontend/nginx-backend-not-found.conf`](../frontend/nginx-backend-not-found.conf)                                                                                                                                                                    | Remove if not needed.                                                                 |

### 3.3 Docker — Remove

| Service            | File                                                            | Reason                                                                                                                                  |
| ------------------ | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Adminer**        | [`compose.yml`](../compose.yml) lines 22–43                     | DB admin UI. Remove for production. Keep in dev override if desired.                                                                    |
| **Mailcatcher**    | [`compose.override.yml`](../compose.override.yml) lines 90–94   | Remove unless email is needed.                                                                                                          |
| **Playwright**     | [`compose.override.yml`](../compose.override.yml) lines 107–130 | E2E test container. Remove.                                                                                                             |
| **Traefik**        | [`compose.traefik.yml`](../compose.traefik.yml)                 | Full Traefik + Let's Encrypt setup. Remove for MVP — deploy behind simple reverse proxy or use simpler hosting (e.g., Railway, Fly.io). |
| **Traefik labels** | [`compose.yml`](../compose.yml)                                 | All `traefik.*` labels on services. Remove.                                                                                             |

### 3.4 Other — Remove

| Item                              | Reason                                   |
| --------------------------------- | ---------------------------------------- |
| `.github/`                        | CI/CD workflows for template. Remove.    |
| `hooks/`                          | Copier post-gen hooks. Remove.           |
| `copier.yml`                      | Template scaffolding config. Remove.     |
| `CONTRIBUTING.md`                 | Template-specific. Remove.               |
| `LICENSE`                         | Replace with clinic project license.     |
| `img/`                            | Template screenshots. Remove.            |
| `deployment.md`, `development.md` | Template docs. Replace with clinic docs. |

---

## 4. SIMPLIFY — Keep but Reduce Scope

### 4.1 Backend — Simplify

| Module                   | File(s)                                                                 | Simplification                                                                                                                                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User model**           | [`backend/app/models.py`](../backend/app/models.py) lines 13–68         | Remove `is_superuser` field. Replace with `role: str = "doctor"` (enum: `admin`, `doctor`). Remove `UserRegister`, `UserUpdateMe`, `UpdatePassword` if not needed. Keep `UserCreate`, `UserUpdate`, `UserPublic`.                           |
| **User CRUD**            | [`backend/app/crud.py`](../backend/app/crud.py)                         | Keep `create_user`, `update_user`, `get_user_by_email`, `authenticate`. Remove `create_item`.                                                                                                                                               |
| **Users route**          | [`backend/app/api/routes/users.py`](../backend/app/api/routes/users.py) | Remove: `read_users` (admin list), `create_user` (admin create), `read_user_by_id`, `update_user`, `delete_user`. Keep: `read_user_me`, `update_user_me`, `update_password_me`. Remove `signup` endpoint.                                   |
| **Login route**          | [`backend/app/api/routes/login.py`](../backend/app/api/routes/login.py) | Keep `login_access_token` and `test_token`. Remove `recover_password`, `reset_password`, `recover_password_html_content` if no email.                                                                                                       |
| **Utils route**          | [`backend/app/api/routes/utils.py`](../backend/app/api/routes/utils.py) | Keep only `/health-check/`. Remove test-email.                                                                                                                                                                                              |
| **`app/utils.py`**       | [`backend/app/utils.py`](../backend/app/utils.py)                       | Remove all email functions (`send_email`, `generate_test_email`, `generate_reset_password_email`, `generate_new_account_email`, `generate_password_reset_token`, `verify_password_reset_token`). Remove `emails` and `jinja2` dependencies. |
| **`app/core/config.py`** | [`backend/app/core/config.py`](../backend/app/core/config.py)           | Remove SMTP/email settings. Remove Sentry DSN. Remove `EMAIL_TEST_USER`. Keep `FIRST_SUPERUSER` → rename to `FIRST_ADMIN`.                                                                                                                  |
| **`app/api/deps.py`**    | [`backend/app/api/deps.py`](../backend/app/api/deps.py)                 | Remove `get_current_active_superuser`. Replace with `get_current_active_admin` checking `role == "admin"`.                                                                                                                                  |
| **`app/main.py`**        | [`backend/app/main.py`](../backend/app/main.py)                         | Remove Sentry import and init.                                                                                                                                                                                                              |

### 4.2 Frontend — Simplify

| Module             | File(s)                                                                                               | Simplification                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Dashboard**      | [`frontend/src/routes/_layout/index.tsx`](../frontend/src/routes/_layout/index.tsx)                   | Keep as landing page. Replace greeting with clinic dashboard (today's appointments, etc.).                    |
| **Settings page**  | [`frontend/src/routes/_layout/settings.tsx`](../frontend/src/routes/_layout/settings.tsx)             | Keep `UserInformation` and `ChangePassword`. Remove `DeleteAccount` tab.                                      |
| **Login page**     | [`frontend/src/routes/login.tsx`](../frontend/src/routes/login.tsx)                                   | Keep. Remove "Forgot password?" link and "Sign up" link. Update title from "FastAPI Template" to clinic name. |
| **Sidebar**        | [`frontend/src/components/Sidebar/AppSidebar.tsx`](../frontend/src/components/Sidebar/AppSidebar.tsx) | Remove "Items" and "Admin" nav items. Add "Appointments", "Patients", "Schedule".                             |
| **`package.json`** | [`frontend/package.json`](../frontend/package.json)                                                   | Remove `@playwright/test`, `playwright` config, test scripts.                                                 |

### 4.3 Docker — Simplify

| Service                    | File                                              | Simplification                                                                                      |
| -------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **`compose.yml`**          | [`compose.yml`](../compose.yml)                   | Remove Adminer service. Remove all Traefik labels. Simplify to: `db`, `backend`, `frontend`.        |
| **`compose.override.yml`** | [`compose.override.yml`](../compose.override.yml) | Remove proxy (Traefik), mailcatcher, playwright. Keep only dev overrides for db, backend, frontend. |

### 4.4 Alembic — Simplify

| Item                   | Simplification                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Existing migration** | [`backend/app/alembic/versions/fe56fa70289e_add_created_at_to_user_and_item.py`](../backend/app/alembic/versions/fe56fa70289e_add_created_at_to_user_and_item.py) | This migration adds `created_at` to User and Item. Since we're starting fresh, **delete all existing migrations** and create a new initial migration with the clinic schema. |
| **Alembic setup**      | [`backend/app/alembic/env.py`](../backend/app/alembic/env.py)                                                                                                     | Keep unchanged — it reads models from `app.models`.                                                                                                                          |

---

## 5. REUSE — Adapt for Clinic MVP

### 5.1 Architecture Patterns to Reuse

| Pattern                       | Source                                                                                                                      | Clinic Adaptation                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **FastAPI app structure**     | [`backend/app/`](../backend/app/)                                                                                           | Keep the same module layout: `api/routes/`, `core/`, `models.py`, `crud.py`.  |
| **SQLModel ORM**              | [`backend/app/models.py`](../backend/app/models.py)                                                                         | Keep SQLModel. Define `Doctor`, `Patient`, `Appointment`, `Schedule` models.  |
| **JWT auth flow**             | [`backend/app/core/security.py`](../backend/app/core/security.py) + [`backend/app/api/deps.py`](../backend/app/api/deps.py) | Reuse exactly. Token in `localStorage`, Bearer header.                        |
| **CRUD pattern**              | [`backend/app/crud.py`](../backend/app/crud.py)                                                                             | Reuse the `session: Session, model_in: ModelCreate` pattern for all new CRUD. |
| **Pydantic validation**       | [`backend/app/models.py`](../backend/app/models.py)                                                                         | Reuse the `SQLModel` → `Create`/`Update`/`Public` pattern for all new models. |
| **Frontend data table**       | [`frontend/src/components/Common/DataTable.tsx`](../frontend/src/components/Common/DataTable.tsx)                           | Reuse for appointments list, patients list.                                   |
| **Form + Dialog pattern**     | [`frontend/src/components/Items/AddItem.tsx`](../frontend/src/components/Items/AddItem.tsx)                                 | Reuse the `Dialog` + `Form` + `useMutation` pattern for all CRUD forms.       |
| **OpenAPI client generation** | [`frontend/openapi-ts.config.ts`](../frontend/openapi-ts.config.ts)                                                         | Reuse `@hey-api/openapi-ts` to auto-generate frontend client from backend.    |
| **React Query caching**       | [`frontend/src/hooks/useAuth.ts`](../frontend/src/hooks/useAuth.ts)                                                         | Reuse `useQuery`/`useMutation` pattern with `queryClient.invalidateQueries`.  |

### 5.2 Suggested New Models (for reference only)

```
Doctor (extends User concept)
  - id, email, hashed_password, full_name, role: "admin"|"doctor", is_active
  - relationships: appointments[]

Patient
  - id, full_name, phone, email?, date_of_birth?, notes?
  - no login, no password

Appointment
  - id, patient_id -> Patient, doctor_id -> Doctor
  - date, time_slot, status: "scheduled"|"completed"|"cancelled"
  - reason, notes

Schedule (weekly availability)
  - id, doctor_id -> Doctor
  - day_of_week, start_time, end_time, slot_duration
```

---

## 6. RISKS

### 6.1 Architectural Risks

| Risk                         | Severity | Mitigation                                                                                                                                      |
| ---------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Over-engineering for MVP** | Medium   | The template's multi-user, superuser/permission system adds complexity. Simplify to `role` field instead of `is_superuser`.                     |
| **SQLModel limitations**     | Low      | SQLModel is still maturing. Complex queries (e.g., finding available slots) may need raw SQLAlchemy. Keep SQLAlchemy as escape hatch.           |
| **JWT in localStorage**      | Medium   | Standard for this template, but XSS-vulnerable. For a clinic with 1–2 doctors, acceptable risk. Use httpOnly cookies if higher security needed. |
| **No refresh tokens**        | Low      | Template uses long-lived tokens (8 days). Acceptable for MVP. Add refresh token rotation later.                                                 |

### 6.2 Migration Risks

| Risk                        | Severity | Mitigation                                                                                                                                           |
| --------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Alembic migration chain** | Medium   | Existing migration references `item` and `user` tables. Since we're starting fresh, **do not reuse old migrations**. Create a new initial migration. |
| **Database reset**          | Low      | No production data exists. Safe to drop and recreate.                                                                                                |

### 6.3 Frontend Risks

| Risk                          | Severity | Mitigation                                                                                                                        |
| ----------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **Generated client mismatch** | Medium   | After changing backend models, regenerate frontend client with `bun run generate-client`. The OpenAPI spec must be updated first. |
| **shadcn/ui version lock**    | Low      | Components are local copies. Upgrading requires manual re-init. Acceptable for MVP.                                               |

### 6.4 Deployment Risks

| Risk                   | Severity | Mitigation                                                                                                                      |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **Traefik complexity** | High     | The template's Traefik setup is overkill. For MVP, use a simpler deployment: Railway, Fly.io, or a single VPS with Caddy/Nginx. |
| **PostgreSQL 18**      | Low      | Template uses PostgreSQL 18. Ensure hosting provider supports it.                                                               |

---

## 7. RECOMMENDED NEXT STEPS

### Phase 1: Strip Template (1–2 days)

1. **Remove** all files listed in Section 3 (REMOVE)
2. **Simplify** all files listed in Section 4 (SIMPLIFY)
3. **Keep** all files listed in Section 2 (KEEP)
4. **Reset** Alembic: delete `versions/` directory, create new initial migration
5. **Update** `.env` with clinic-specific values
6. **Verify** backend starts, frontend compiles

### Phase 2: Build Clinic Models (2–3 days)

1. Define `Doctor`, `Patient`, `Appointment`, `Schedule` models in `backend/app/models.py`
2. Create CRUD functions in `backend/app/crud.py`
3. Create API routes in `backend/app/api/routes/`
4. Generate new Alembic migration
5. Regenerate frontend client

### Phase 3: Build Frontend (3–5 days)

1. Create appointment booking page (reuse DataTable + Dialog patterns)
2. Create patient management page
3. Create doctor schedule settings page
4. Update sidebar navigation
5. Rebrand logo, colors, titles

### Phase 4: AI Integration (later)

1. Add AI-powered booking suggestion endpoint
2. Integrate with frontend booking flow

---

## Summary Table

| Category            | KEEP | REMOVE | SIMPLIFY |
| ------------------- | ---- | ------ | -------- |
| Backend modules     | 10   | 4      | 7        |
| Frontend components | 25+  | 15+    | 5        |
| Docker services     | 3    | 4      | 2        |
| Tests               | 0    | All    | 0        |
| Config files        | 5    | 6      | 2        |

**Estimated effort to strip template:** 1–2 days  
**Estimated effort to build clinic MVP on stripped template:** 5–8 days
