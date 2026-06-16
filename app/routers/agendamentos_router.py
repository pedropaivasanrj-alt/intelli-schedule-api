from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.agendamento_schema import AgendamentoAlunoCreate
from app.services.agendamento_service import (
    gerar_agendamentos_automaticos,
    listar_agenda_completa,
    listar_agenda_por_professor,
    listar_agenda_por_aluno,
    listar_horarios_disponiveis,
    agendar_reuniao_por_aluno,
)

router = APIRouter(
    prefix="/api/v1/agendamentos",
    tags=["Agendamentos"]
)


@router.post("/gerar")
def gerar_agendamentos(db: Session = Depends(get_db)):
    return gerar_agendamentos_automaticos(db)


@router.get("/horarios-disponiveis")
def visualizar_horarios_disponiveis(
    data: date,
    professor_id: Optional[int] = Query(default=None),
    db: Session = Depends(get_db)
):
    return listar_horarios_disponiveis(
        db=db,
        data=data,
        professor_id=professor_id
    )


@router.post("/aluno/agendar")
def aluno_agendar_reuniao(
    dados: AgendamentoAlunoCreate,
    db: Session = Depends(get_db)
):
    return agendar_reuniao_por_aluno(
        db=db,
        aluno_id=dados.aluno_id,
        projeto_id=dados.projeto_id,
        professor_id=dados.professor_id,
        data_hora_inicio=dados.data_hora_inicio
    )


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
        from fastapi import HTTPException
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
        from fastapi import HTTPException
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )

    return resultado