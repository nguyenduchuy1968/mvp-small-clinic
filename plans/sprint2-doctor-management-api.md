# Sprint 2 — Doctor Management API

## Overview

Implement Doctor Management API endpoints, CRUD layer, and tests. The Doctor model, schemas, and database migration already exist from Sprint 1. This sprint adds the missing CRUD operations, API routes, and test coverage.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI Application                    │
├─────────────────────────────────────────────────────────────┤
│  api/main.py  ←──  api/routes/doctors.py  ←──  crud.py     │
│                     (new file)              (new functions) │
│                                                             │
│  models.py (existing)                                       │
│  - Doctor, DoctorCreate, DoctorUpdate                       │
│  - DoctorPublic, DoctorsPublic                              │
│                                                             │
│  api/deps.py (existing)                                     │
│  - CurrentUser, CurrentDoctor, SessionDep                   │
│  - get_current_active_superuser                             │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify

### 1. [`backend/app/crud.py`](../backend/app/crud.py)

Add 5 new CRUD functions following the existing pattern (see `create_user`, `update_user`):

| Function                                            | Description                      | Validation                                      |
| --------------------------------------------------- | -------------------------------- | ----------------------------------------------- |
| `create_doctor(*, session, doctor_create, user_id)` | Create doctor profile for a user | Raises 400 if doctor already exists for user_id |
| `get_doctor(*, session, doctor_id)`                 | Get single doctor by ID          | Returns None if not found                       |
| `get_doctors(*, session, skip, limit)`              | List doctors with pagination     | Returns list + count                            |
| `update_doctor(*, session, db_doctor, doctor_in)`   | Update doctor fields             | Uses `exclude_unset=True`                       |
| `delete_doctor(*, session, db_doctor)`              | Delete doctor record             | Calls `session.delete`                          |

**Key validation:** Check `unique user_id` constraint — raise error if a Doctor already exists for the given `user_id` on create.

### 2. [`backend/app/api/routes/doctors.py`](../backend/app/api/routes/doctors.py) — NEW FILE

Create a new routes file following the pattern in [`users.py`](../backend/app/api/routes/users.py).

| Method   | Path              | Auth          | Description                                |
| -------- | ----------------- | ------------- | ------------------------------------------ |
| `POST`   | `/doctors/`       | Admin only    | Create doctor profile                      |
| `GET`    | `/doctors/`       | Public        | List all active doctors                    |
| `GET`    | `/doctors/public` | Public        | List all active doctors (alias for public) |
| `GET`    | `/doctors/{id}`   | Authenticated | Get doctor by ID                           |
| `PATCH`  | `/doctors/{id}`   | Admin only    | Update doctor                              |
| `DELETE` | `/doctors/{id}`   | Admin only    | Delete doctor                              |

**Route details:**

```python
router = APIRouter(prefix="/doctors", tags=["doctors"])
```

- **POST /doctors/** — `create_doctor`

  - Dependency: `get_current_active_superuser`
  - Body: `DoctorCreate` + `user_id: uuid.UUID` (which user this doctor profile belongs to)
  - Response: `DoctorPublic`
  - Validation: Check no doctor exists for that user_id

- **GET /doctors/** — `read_doctors`

  - No auth required (public)
  - Query params: `skip: int = 0, limit: int = 100`
  - Response: `DoctorsPublic`
  - Only returns active doctors (`is_active=True`)

- **GET /doctors/public** — `read_doctors_public`

  - No auth required (public)
  - Same as above but explicitly named for public access
  - Response: `DoctorsPublic`

- **GET /doctors/{id}** — `read_doctor`

  - Dependency: `CurrentUser` (any authenticated user)
  - Response: `DoctorPublic`
  - 404 if not found

- **PATCH /doctors/{id}** — `update_doctor`

  - Dependency: `get_current_active_superuser`
  - Body: `DoctorUpdate`
  - Response: `DoctorPublic`
  - 404 if not found

- **DELETE /doctors/{id}** — `delete_doctor`
  - Dependency: `get_current_active_superuser`
  - Response: `Message`
  - 404 if not found

### 3. [`backend/app/api/main.py`](../backend/app/api/main.py)

Add import and registration of the doctors router:

```python
from app.api.routes import doctors, login, private, users, utils
# ...
api_router.include_router(doctors.router)
```

### 4. [`backend/tests/api/routes/test_doctors.py`](../backend/tests/api/routes/test_doctors.py) — NEW FILE

Create comprehensive tests following the pattern in [`test_users.py`](../backend/tests/api/routes/test_users.py).

**Test categories:**

| Category             | Tests                                                                     |
| -------------------- | ------------------------------------------------------------------------- |
| **CRUD tests**       | Create doctor, get doctor, get doctors list, update doctor, delete doctor |
| **Permission tests** | Non-admin cannot create/update/delete, unauthenticated cannot get by ID   |
| **Validation tests** | Duplicate user_id, non-existent user_id, doctor not found                 |

**Test fixtures needed:**

- `superuser_token_headers` (already exists in conftest.py)
- `normal_user_token_headers` (already exists in conftest.py)
- Helper to create a test user + doctor pair

## No Migration Required

The Doctor table was already created in migration `2a7b9c3d1e5f_add_user_role_and_doctor_model`. No schema changes are needed.

## Verification

After implementation, run:

```bash
cd backend
uv run pytest tests/api/routes/test_doctors.py -v
uv run pytest tests/ -v  # ensure no regressions
```

## Implementation Order

1. Add CRUD functions to [`crud.py`](../backend/app/crud.py)
2. Create [`doctors.py`](../backend/app/api/routes/doctors.py) routes file
3. Register router in [`api/main.py`](../backend/app/api/main.py)
4. Create [`test_doctors.py`](../backend/tests/api/routes/test_doctors.py)
5. Run all tests to verify
