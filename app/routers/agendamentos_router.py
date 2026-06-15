from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.agendamento_service import gerar_agendamentos_automaticos

router = APIRouter(
    prefix="/api/v1/agendamentos",
    tags=["Agendamentos"]
)


@router.post("/gerar")
def gerar_agendamentos(db: Session = Depends(get_db)):
    resultado = gerar_agendamentos_automaticos(db)
    return resultado