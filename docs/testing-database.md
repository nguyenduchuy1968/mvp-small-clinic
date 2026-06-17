# Test Database Separation

## Architecture

Development and tests use **separate PostgreSQL databases** to prevent accidental data loss.

```mermaid
flowchart TD
    subgraph Development
        DEV_APP[FastAPI App]
        DEV_ENGINE[engine: app.core.db.engine]
        DEV_DB[(Database: app)]
        DEV_APP --> DEV_ENGINE --> DEV_DB
    end

    subgraph Testing
        TEST_APP[Pytest]
        TEST_ENGINE[test_engine: tests.utils.database]
        TEST_DB[(Database: app_test)]
        TEST_APP --> TEST_ENGINE --> TEST_DB
    end

    DEV_DB -.->|NO ACCESS| TEST_APP
    TEST_DB -.->|NO ACCESS| DEV_APP
```

| Environment | Database   | Purpose                                                   |
| ----------- | ---------- | --------------------------------------------------------- |
| Development | `app`      | All development data (admin users, doctors, appointments) |
| Testing     | `app_test` | Isolated test data, automatically cleaned between runs    |

## How It Works

1. **Auto-create** — When pytest starts, [`create_database_if_not_exists()`](backend/tests/utils/database.py:28) in [`tests/utils/database.py`](backend/tests/utils/database.py) connects to the `postgres` default database and issues `CREATE DATABASE app_test` if it doesn't exist.

2. **Dedicated engine** — A `test_engine` is created pointing to `app_test` using `settings.SQLALCHEMY_TEST_DATABASE_URI` (which reads `POSTGRES_DB_TEST` from the environment, defaulting to `"app_test"`).

3. **Safety guard** — [`verify_test_database()`](backend/tests/utils/database.py:47) queries `SELECT current_database()` and asserts the name contains `_test`. If it doesn't, pytest crashes immediately with:

   ```
   CRITICAL: Tests are connected to 'app' which is NOT a test database!
   Aborting to protect development data.
   ```

4. **Isolated teardown** — The [`db` fixture](backend/tests/conftest.py:36) in [`conftest.py`](backend/tests/conftest.py) uses `test_engine`, so the `delete(User)` teardown only affects `app_test`.

## Configuration

### Default (no changes needed)

The test database defaults to `app_test` in [`config.py`](backend/app/core/config.py:60):

```python
POSTGRES_DB_TEST: str = "app_test"
```

### Override via `.env`

Add to your [`.env`](.env) file if you need a different name:

```env
POSTGRES_DB_TEST=app_test
```

### Connection Strings

| Environment | Database   | Connection String                                                    |
| ----------- | ---------- | -------------------------------------------------------------------- |
| Development | `app`      | `postgresql+psycopg://postgres:PoS_311-gres@127.0.0.1:5432/app`      |
| Testing     | `app_test` | `postgresql+psycopg://postgres:PoS_311-gres@127.0.0.1:5432/app_test` |

## How to Create `app_test` Manually

The database is created **automatically** when you run pytest. To create it manually:

### Via SQL

```sql
CREATE DATABASE app_test;
```

### Via pgAdmin 4

1. Right-click **Databases** > **Create** > **Database**
2. Name: `app_test`
3. Click **Save**

## How to Run Tests Safely

```bash
cd backend
pytest
```

The safety guard will:

- Verify the database is `app_test` (not `app`)
- Fail immediately with a clear error if anything is misconfigured

## Verification

After running tests, verify isolation:

### Via SQL

```sql
-- Connect to app database
\c app
SELECT COUNT(*) FROM "user";  -- Should show your admin user

-- Connect to app_test database
\c app_test
SELECT COUNT(*) FROM "user";  -- Should be 0 (cleaned by teardown)
```

### Via pgAdmin 4

1. Connect to `app` → Schemas → Tables → `user` → View/Edit Data → should show admin user
2. Connect to `app_test` → Schemas → Tables → `user` → View/Edit Data → should be empty

## File Reference

| File                                                                 | Role                                                             |
| -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| [`backend/app/core/config.py`](backend/app/core/config.py:60)        | Defines `POSTGRES_DB_TEST` and `SQLALCHEMY_TEST_DATABASE_URI`    |
| [`backend/tests/utils/database.py`](backend/tests/utils/database.py) | Test-layer utilities: engine creation, auto-create, safety guard |
| [`backend/tests/conftest.py`](backend/tests/conftest.py)             | Uses `test_engine` for all fixtures                              |
| [`backend/app/tests_pre_start.py`](backend/app/tests_pre_start.py)   | Docker test pre-start script uses test engine                    |

## Risk Assessment

| Risk                                   | Mitigation                                         |
| -------------------------------------- | -------------------------------------------------- |
| Tests accidentally connect to `app`    | Safety guard checks database name contains `_test` |
| `app_test` doesn't exist               | Auto-created during test setup                     |
| Test teardown deletes development data | Teardown runs against `app_test` only              |
| Developer forgets to create test DB    | Automatic creation handles this                    |
| Migration state differs between DBs    | Both databases use the same Alembic migrations     |
