from fastapi import FastAPI
<<<<<<< HEAD
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])

@app.get("/")
def root():
    return {"message": "Waste Not Feed All API"}
=======
from fastapi.middleware.cors import CORSMiddleware  # 1. Add this import
from app.routers import donation

app = FastAPI()

# 2. Add this block BEFORE including the router
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your React web app to connect
    allow_credentials=True,
    allow_methods=["*"],  # Allows GET, POST, etc.
    allow_headers=["*"],  # Allows all headers
)

app.include_router(donation.router)
>>>>>>> 42d598a (Updated donation backend and frontend)
