# Database Design

## users

Purpose:

System authentication.

Fields:

* id
* email
* password_hash
* role
* is_active
* created_at
* updated_at

Roles:

* admin
* doctor

---

## doctors

Fields:

* id
* user_id
* full_name
* photo_url
* specialty
* experience_years
* bio
* is_active

---

## services

Fields:

* id
* doctor_id
* name
* description
* duration_minutes
* price_display
* is_active

Examples:

* Consultation
* Dental Cleaning
* Implant Consultation

---

## appointments

Fields:

* id

* doctor_id

* service_id

* patient_name

* patient_phone

* patient_email

* appointment_datetime

* status

* notes

Statuses:

* pending
* confirmed
* cancelled

---

## availability

Fields:

* id
* doctor_id
* weekday
* start_time
* end_time
* is_enabled

---

## blocked_dates

Fields:

* id
* doctor_id
* blocked_date
* reason

---

## clinic_settings

Fields:

* id

* clinic_name

* phone

* email

* address

* google_maps_url

* hero_title

* hero_subtitle

* working_hours

* created_at

* updated_at
