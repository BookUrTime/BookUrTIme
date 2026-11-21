import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from config import settings
from routers import providers, bookings, users, dashboard, reminders, business
from seed import seed_data

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("bookurtime")

app = FastAPI(title="BookUrTime API - B2B Business & User Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled error processing request %s %s: %s", request.method, request.url.path, str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error. Please try again later."},
    )

app.include_router(business.router)
app.include_router(providers.router)
app.include_router(bookings.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(reminders.router)

@app.on_event("startup")
async def on_startup():
    logger.info("Starting BookUrTime API engine and seeding data...")
    await seed_data()
    logger.info("Startup seed and initialization completed successfully.")

@app.get("/")
def root():
    return {
        "message": "Welcome to BookUrTime B2B Platform API",
        "version": "2.0.0",
        "docs": "/docs",
    }
