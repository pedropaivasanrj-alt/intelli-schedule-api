from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.reuniao import Reuniao

router = APIRouter(
    prefix="/api/v1/reunioes",
    tags=["Reuniões"]
)


@router.get("/")
def listar_reunioes(db: Session = Depends(get_db)):
    reunioes = db.query(Reuniao).all()
    return reunioes


@router.get("/{reuniao_id}")
def buscar_reuniao(reuniao_id: int, db: Session = Depends(get_db)):
    reuniao = db.query(Reuniao).filter(Reuniao.id == reuniao_id).first()

    if not reuniao:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    return reuniao


@router.patch("/{reuniao_id}/status")
def atualizar_status_reuniao(
    reuniao_id: int,
    status: str,
    db: Session = Depends(get_db)
):
    reuniao = db.query(Reuniao).filter(Reuniao.id == reuniao_id).first()

    if not reuniao:
        raise HTTPException(status_code=404, detail="Reunião não encontrada")

    reuniao.status = status
    db.commit()
    db.refresh(reuniao)

    return reuniao