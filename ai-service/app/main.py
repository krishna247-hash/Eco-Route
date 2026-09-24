from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.routers import carbon, chat, itineraries, optimize, recommend

load_dotenv()

app = FastAPI(title="EcoRoute AI Service")

app.include_router(carbon.router)
app.include_router(itineraries.router)
app.include_router(optimize.router)
app.include_router(recommend.router)
app.include_router(chat.router)


# app/core/llm_client.py raises RuntimeError exclusively for LLM
# configuration/request failures (missing or invalid GEMINI_API_KEY, the
# Gemini API rejecting the request, etc). Left unhandled, FastAPI turns
# any exception into a bare 500 "Internal Server Error" with no detail,
# which makes a bad API key indistinguishable from a real server bug.
# Report it as 503 (this service's upstream dependency is unavailable)
# with the actual reason, the same "honestly fail with a clear reason"
# pattern the backend's payment service uses for a missing Stripe key.
@app.exception_handler(RuntimeError)
async def llm_runtime_error_handler(_request: Request, exc: RuntimeError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(exc)})
