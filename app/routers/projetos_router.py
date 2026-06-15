from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.projeto import Projeto
from app.schemas.projeto_schema import ProjetoCreate, ProjetoResponse

router = APIRouter(
    prefix="/api/v1/projetos",
    tags=["Projetos"]
)


@router.post("/", response_model=ProjetoResponse)
def criar_projeto(
    projeto: ProjetoCreate,
    db: Session = Depends(get_db)
):
    novo_projeto = Projeto(
        nome=projeto.nome,
        alunos_envolvidos=projeto.alunos_envolvidos,
        descricao_foco=projeto.descricao_foco
    )

    db.add(novo_projeto)
    db.commit()
    db.refresh(novo_projeto)

    return novo_projeto


@router.get("/", response_model=list[ProjetoResponse])
def listar_projetos(db: Session = Depends(get_db)):
    projetos = db.query(Projeto).all()
    return projetos


@router.get("/{projeto_id}", response_model=ProjetoResponse)
def buscar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db)
):
    projeto = (
        db.query(Projeto)
        .filter(Projeto.id == projeto_id)
        .first()
    )

    if not projeto:
        raise HTTPException(
            status_code=404,
            detail="Projeto não encontrado"
        )

    return projeto


@router.delete("/{projeto_id}")
def deletar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db)
):
    projeto = (
        db.query(Projeto)
        .filter(Projeto.id == projeto_id)
        .first()
    )

    if not projeto:
        raise HTTPException(
            status_code=404,
            detail="Projeto não encontrado"
        )

    db.delete(projeto)
    db.commit()

    return {"message": "Projeto deletado com sucesso"}