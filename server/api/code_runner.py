import subprocess
import sys

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/code")


class CodeInput(BaseModel):
    code: str


@router.post("/run")
def run_code(data: CodeInput):
    try:
        result = subprocess.run(
            [sys.executable, "-c", data.code],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
        }
    except subprocess.TimeoutExpired:
        return {
            "stdout": "",
            "stderr": "执行超时（10秒限制）",
            "returncode": -1,
        }
