from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reuniao import Reuniao
from app.models.projeto import Projeto
from app.models.professor import Professor
from app.schemas.reuniao_schema import (
    ReuniaoCreate,
    ReuniaoResponse,
    ReuniaoStatusUpdate
)

router = APIRouter(
    prefix="/api/v1/reunioes",
    tags=["Reuniões"]
)


@router.post("/", response_model=ReuniaoResponse)
def criar_reuniao(
    reuniao: ReuniaoCreate,
    db: Session = Depends(get_db)
):
    projeto = (
        db.query(Projeto)
        .filter(Projeto.id == reuniao.projeto_id)
        .first()
    )

    if not projeto:
        raise HTTPException(
            status_code=404,
            detail="Projeto não encontrado"
        )

    professor = (
        db.query(Professor)
        .filter(Professor.id == reuniao.professor_id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado"
        )

    if reuniao.data_hora_fim <= reuniao.data_hora_inicio:
        raise HTTPException(
            status_code=400,
            detail="A data/hora final deve ser maior que a data/hora inicial"
        )

    nova_reuniao = Reuniao(
        projeto_id=reuniao.projeto_id,
        professor_id=reuniao.professor_id,
        ciclo_avaliacao=reuniao.ciclo_avaliacao,
        data_hora_inicio=reuniao.data_hora_inicio,
        data_hora_fim=reuniao.data_hora_fim,
        status=reuniao.status
    )

    db.add(nova_reuniao)
    db.commit()
    db.refresh(nova_reuniao)

    return nova_reuniao


@router.get("/", response_model=list[ReuniaoResponse])
def listar_reunioes(db: Session = Depends(get_db)):
    return db.query(Reuniao).all()


@router.get("/{reuniao_id}", response_model=ReuniaoResponse)
def buscar_reuniao(
    reuniao_id: int,
    db: Session = Depends(get_db)
):
    reuniao = (
        db.query(Reuniao)
        .filter(Reuniao.id == reuniao_id)
        .first()
    )

    if not reuniao:
        raise HTTPException(
            status_code=404,
            detail="Reunião não encontrada"
        )

    return reuniao


@router.patch("/{reuniao_id}/status", response_model=ReuniaoResponse)
def atualizar_status_reuniao(
    reuniao_id: int,
    dados: ReuniaoStatusUpdate,
    db: Session = Depends(get_db)
):
    reuniao = (
        db.query(Reuniao)
        .filter(Reuniao.id == reuniao_id)
        .first()
    )

    if not reuniao:
        raise HTTPException(
            status_code=404,
            detail="Reunião não encontrada"
        )

    reuniao.status = dados.status

    db.commit()
    db.refresh(reuniao)

    return reuniao


@router.delete("/{reuniao_id}")
def deletar_reuniao(
    reuniao_id: int,
    db: Session = Depends(get_db)
):
    reuniao = (
        db.query(Reuniao)
        .filter(Reuniao.id == reuniao_id)
        .first()
    )

    if not reuniao:
        raise HTTPException(
            status_code=404,
            detail="Reunião não encontrada"
        )

    db.delete(reuniao)
    db.commit()

    return {"message": "Reunião deletada com sucesso"}