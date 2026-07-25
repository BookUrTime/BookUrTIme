from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import providers, bookings, users, dashboard, reminders
from seed import seed_data

app = FastAPI(title="ApnaSlot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(providers.router)
app.include_router(bookings.router)
app.include_router(users.router)
app.include_router(dashboard.router)
app.include_router(reminders.router)

@app.on_event("startup")
async def on_startup():
    await seed_data()

@app.get("/")
def root():
    return {"message": "Welcome to ApnaSlot API"}
