from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.agendamento_service import (
    gerar_agendamentos_automaticos,
    listar_agenda_completa,
    listar_agenda_por_professor,
    listar_agenda_por_aluno,
)

router = APIRouter(
    prefix="/api/v1/agendamentos",
    tags=["Agendamentos"]
)


@router.post("/gerar")
def gerar_agendamentos(db: Session = Depends(get_db)):
    return gerar_agendamentos_automaticos(db)


@router.get("/agenda")
def visualizar_agenda_completa(db: Session = Depends(get_db)):
    return listar_agenda_completa(db)


@router.get("/professor/{professor_id}")
def visualizar_agenda_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    resultado = listar_agenda_por_professor(db, professor_id)

    if resultado is None:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado"
        )

    return resultado


@router.get("/aluno/{aluno_id}")
def visualizar_agenda_aluno(
    aluno_id: int,
    db: Session = Depends(get_db)
):
    resultado = listar_agenda_por_aluno(db, aluno_id)

    if resultado is None:
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )

    return resultado