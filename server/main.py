from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.svd_compute import router as svd_router
from api.code_runner import router as code_router
from api.neural_net import router as nn_router

app = FastAPI(title="SVD Learning Tool API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(svd_router)
app.include_router(code_router)
app.include_router(nn_router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
