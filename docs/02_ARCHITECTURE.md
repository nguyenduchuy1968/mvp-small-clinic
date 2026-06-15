# Architecture

## Architecture Style

Modular Monolith

Reason:

* Fast development
* Simple deployment
* Easy maintenance
* Suitable for small clinics

---

## Backend Layers

API Layer

Responsibilities:

* Receive requests
* Validate input
* Return responses

---

Service Layer

Responsibilities:

* Business logic
* Booking rules
* Availability checks
* Notification triggering

---

CRUD Layer

Responsibilities:

* Database access
* Queries
* Persistence

---

Database Layer

PostgreSQL

---

## Core Modules

Auth

Doctors

Services

Appointments

Availability

Clinic Settings

AI Assistant

Notifications

---

## Notification Architecture

Notification Service

Providers:

* Email
* Telegram (future)
* Zalo (future)
* SMS (future)

---

## AI Architecture

AI = Conversation Layer

Backend = Business Logic

AI never creates appointments directly.

AI calls backend services.

---

## Deployment

Frontend Container

Backend Container

PostgreSQL Container

Docker Compose
