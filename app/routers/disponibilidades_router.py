from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.disponibilidade import Disponibilidade
from app.models.professor import Professor
from app.schemas.disponibilidade_schema import (
    DisponibilidadeCreate,
    DisponibilidadeResponse
)

router = APIRouter(
    prefix="/api/v1/disponibilidades",
    tags=["Disponibilidades"]
)


@router.post("/", response_model=DisponibilidadeResponse)
def criar_disponibilidade(
    disponibilidade: DisponibilidadeCreate,
    db: Session = Depends(get_db)
):
    professor = (
        db.query(Professor)
        .filter(Professor.id == disponibilidade.professor_id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado"
        )

    nova_disponibilidade = Disponibilidade(
        professor_id=disponibilidade.professor_id,
        data=disponibilidade.data,
        hora_inicio=disponibilidade.hora_inicio,
        hora_fim=disponibilidade.hora_fim
    )

    db.add(nova_disponibilidade)
    db.commit()
    db.refresh(nova_disponibilidade)

    return nova_disponibilidade


@router.get("/", response_model=list[DisponibilidadeResponse])
def listar_disponibilidades(db: Session = Depends(get_db)):
    return db.query(Disponibilidade).all()


@router.get("/{disponibilidade_id}", response_model=DisponibilidadeResponse)
def buscar_disponibilidade(
    disponibilidade_id: int,
    db: Session = Depends(get_db)
):
    disponibilidade = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.id == disponibilidade_id)
        .first()
    )

    if not disponibilidade:
        raise HTTPException(
            status_code=404,
            detail="Disponibilidade não encontrada"
        )

    return disponibilidade


@router.delete("/{disponibilidade_id}")
def deletar_disponibilidade(
    disponibilidade_id: int,
    db: Session = Depends(get_db)
):
    disponibilidade = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.id == disponibilidade_id)
        .first()
    )

    if not disponibilidade:
        raise HTTPException(
            status_code=404,
            detail="Disponibilidade não encontrada"
        )

    db.delete(disponibilidade)
    db.commit()

    return {"message": "Disponibilidade deletada com sucesso"}