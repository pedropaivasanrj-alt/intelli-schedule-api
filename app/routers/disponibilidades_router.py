from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.disponibilidade import Disponibilidade

router = APIRouter(
    prefix="/api/v1/disponibilidades",
    tags=["Disponibilidades"]
)


@router.get("/")
def listar_disponibilidades(db: Session = Depends(get_db)):
    disponibilidades = db.query(Disponibilidade).all()
    return disponibilidades


@router.get("/{disponibilidade_id}")
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