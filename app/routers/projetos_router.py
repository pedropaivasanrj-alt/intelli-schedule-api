from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.projeto import Projeto

router = APIRouter(
    prefix="/api/v1/projetos",
    tags=["Projetos"]
)


@router.get("/")
def listar_projetos(db: Session = Depends(get_db)):
    projetos = db.query(Projeto).all()
    return projetos


@router.get("/{projeto_id}")
def buscar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    return projeto


@router.delete("/{projeto_id}")
def deletar_projeto(projeto_id: int, db: Session = Depends(get_db)):
    projeto = db.query(Projeto).filter(Projeto.id == projeto_id).first()

    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    db.delete(projeto)
    db.commit()

    return {"message": "Projeto deletado com sucesso"}