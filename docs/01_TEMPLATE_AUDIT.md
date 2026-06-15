# Template Audit

Base Template:
FastAPI Full Stack Template

Decision:
Use template as foundation.

Do not rewrite infrastructure.

---

## KEEP

Backend:

* config.py
* security.py
* db.py
* deps.py
* main.py
* JWT Authentication
* SQLModel
* Alembic
* Docker

Frontend:

* React structure
* shadcn/ui
* DataTable
* Sidebar
* OpenAPI client
* React Query

---

## REMOVE

Backend:

* Item CRUD
* Item models
* Item routes

Frontend:

* Items page
* Signup page
* Admin user management
* Template branding

Infrastructure:

* Copier files
* Template documentation

---

## SIMPLIFY

Users:

* Remove SaaS complexity
* Keep Admin and Doctor roles

Email:

* Keep notification infrastructure
* Remove password recovery workflows

Admin:

* Convert to Clinic Admin

Deployment:

* Ignore Traefik initially

---

## NEW MODULES

Backend:

* Doctors
* Services
* Appointments
* Availability
* Blocked Dates
* Clinic Settings
* AI Assistant
* Notifications

Frontend:

* Landing Page
* Doctor Directory
* Booking Flow
* Doctor Dashboard
* Clinic Admin
