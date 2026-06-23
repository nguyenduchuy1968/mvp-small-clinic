import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import emails  # type: ignore[import-untyped]
import jwt
from jinja2 import Template
from jwt.exceptions import InvalidTokenError

from app.core import security
from app.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class EmailData:
    html_content: str
    subject: str


def render_email_template(*, template_name: str, context: dict[str, Any]) -> str:
    template_str = (
        Path(__file__).parent / "email-templates" / "build" / template_name
    ).read_text()
    html_content = Template(template_str).render(context)
    return html_content


def send_email(
    *,
    email_to: str,
    subject: str = "",
    html_content: str = "",
) -> None:
    assert settings.emails_enabled, "no provided configuration for email variables"
    message = emails.Message(
        subject=subject,
        html=html_content,
        mail_from=(settings.EMAILS_FROM_NAME, settings.EMAILS_FROM_EMAIL),
    )
    smtp_options = {"host": settings.SMTP_HOST, "port": settings.SMTP_PORT}
    if settings.SMTP_TLS:
        smtp_options["tls"] = True
    elif settings.SMTP_SSL:
        smtp_options["ssl"] = True
    if settings.SMTP_USER:
        smtp_options["user"] = settings.SMTP_USER
    if settings.SMTP_PASSWORD:
        smtp_options["password"] = settings.SMTP_PASSWORD
    response = message.send(to=email_to, smtp=smtp_options)
    logger.info(f"send email result: {response}")


def send_email_safe(
    *,
    email_type: str,
    appointment_id: str,
    email_to: str,
    subject: str,
    html_content: str,
) -> None:
    """
    Safe email sender that never raises exceptions to the caller.

    Wraps send_email() in try/except and logs all failures with structured
    fields for debugging. Designed for use with FastAPI BackgroundTasks
    where email failure must not affect the primary operation.

    Logging fields:
    - email_type:     Type of email (e.g., "booking_confirmation", "doctor_notification")
    - appointment_id: The appointment UUID as string
    - email_to:       Recipient email address
    - error_message:  Exception message if sending fails
    """
    try:
        send_email(
            email_to=email_to,
            subject=subject,
            html_content=html_content,
        )
        logger.info(
            "Email sent successfully",
            extra={
                "email_type": email_type,
                "appointment_id": appointment_id,
                "email_to": email_to,
            },
        )
    except Exception as exc:
        logger.error(
            "Email sending failed",
            extra={
                "email_type": email_type,
                "appointment_id": appointment_id,
                "email_to": email_to,
                "error_message": str(exc),
            },
            exc_info=True,
        )


def generate_test_email(email_to: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Test email"
    html_content = render_email_template(
        template_name="test_email.html",
        context={"project_name": settings.PROJECT_NAME, "email": email_to},
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_reset_password_email(email_to: str, email: str, token: str) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Password recovery for user {email}"
    link = f"{settings.FRONTEND_HOST}/reset-password?token={token}"
    html_content = render_email_template(
        template_name="reset_password.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": email,
            "email": email_to,
            "valid_hours": settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS,
            "link": link,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_new_account_email(
    email_to: str, username: str, password: str
) -> EmailData:
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New account for user {username}"
    html_content = render_email_template(
        template_name="new_account.html",
        context={
            "project_name": settings.PROJECT_NAME,
            "username": username,
            "password": password,
            "email": email_to,
            "link": settings.FRONTEND_HOST,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_booking_confirmation_email(
    *,
    patient_name: str,
    booking_number: str,
    doctor_name: str,
    appointment_date: str,
    appointment_time: str,
) -> EmailData:
    """
    Generate a booking confirmation email for the patient.
    All parameters are primitive types (strings) to ensure safe usage
    with FastAPI BackgroundTasks (no ORM objects).
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - Appointment Confirmation - {booking_number}"
    html_content = render_email_template(
        template_name="booking_confirmation.html",
        context={
            "project_name": project_name,
            "patient_name": patient_name,
            "booking_number": booking_number,
            "doctor_name": doctor_name,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_doctor_notification_email(
    *,
    doctor_name: str,
    patient_name: str,
    patient_email: str,
    booking_number: str,
    appointment_date: str,
    appointment_time: str,
) -> EmailData:
    """
    Generate a new appointment notification email for the doctor.
    All parameters are primitive types (strings) to ensure safe usage
    with FastAPI BackgroundTasks (no ORM objects).
    """
    project_name = settings.PROJECT_NAME
    subject = f"{project_name} - New Appointment - {booking_number}"
    html_content = render_email_template(
        template_name="doctor_new_appointment.html",
        context={
            "project_name": project_name,
            "doctor_name": doctor_name,
            "patient_name": patient_name,
            "patient_email": patient_email,
            "booking_number": booking_number,
            "appointment_date": appointment_date,
            "appointment_time": appointment_time,
        },
    )
    return EmailData(html_content=html_content, subject=subject)


def generate_password_reset_token(email: str) -> str:
    delta = timedelta(hours=settings.EMAIL_RESET_TOKEN_EXPIRE_HOURS)
    now = datetime.now(timezone.utc)
    expires = now + delta
    exp = expires.timestamp()
    encoded_jwt = jwt.encode(
        {"exp": exp, "nbf": now, "sub": email},
        settings.SECRET_KEY,
        algorithm=security.ALGORITHM,
    )
    return encoded_jwt


def verify_password_reset_token(token: str) -> str | None:
    try:
        decoded_token = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        return str(decoded_token["sub"])
    except InvalidTokenError:
        return None
