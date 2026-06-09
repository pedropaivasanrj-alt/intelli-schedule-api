from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.professor import Professor

router = APIRouter(
    prefix="/api/v1/professores",
    tags=["Professores"]
)


@router.get("/")
def listar_professores(db: Session = Depends(get_db)):
    professores = db.query(Professor).all()
    return professores


@router.get("/{professor_id}")
def buscar_professor(professor_id: int, db: Session = Depends(get_db)):
    professor = db.query(Professor).filter(Professor.id == professor_id).first()

    if not professor:
        raise HTTPException(status_code=404, detail="Professor não encontrado")

    return professor