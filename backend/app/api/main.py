# .venv\Scripts\activate   (.venv only in root)

# uv run fastapi dev app/main.py

# uv run python -u -m app.initial_data   (створювати нового admin.)

# username: nguyenduchuy1968@gmail.com
# password: Admin123456


from app.api.routes import appointments, availability, blocked_dates, doctors, login, private, users, utils
from app.core.config import settings
from fastapi import APIRouter

api_router = APIRouter()
api_router.include_router(appointments.router)
api_router.include_router(availability.router)
api_router.include_router(blocked_dates.router)
api_router.include_router(doctors.router)
api_router.include_router(login.router)
api_router.include_router(users.router)
api_router.include_router(utils.router)


if settings.ENVIRONMENT == "local":
    api_router.include_router(private.router)
