from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.aluno import Aluno
from app.schemas.aluno_schema import AlunoCreate, AlunoResponse

router = APIRouter(
    prefix="/api/v1/alunos",
    tags=["Alunos"]
)


@router.post("/", response_model=AlunoResponse)
def criar_aluno(
    aluno: AlunoCreate,
    db: Session = Depends(get_db)
):
    aluno_existente = (
        db.query(Aluno)
        .filter(Aluno.email == aluno.email)
        .first()
    )

    if aluno_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um aluno cadastrado com este e-mail"
        )

    if aluno.matricula:
        matricula_existente = (
            db.query(Aluno)
            .filter(Aluno.matricula == aluno.matricula)
            .first()
        )

        if matricula_existente:
            raise HTTPException(
                status_code=400,
                detail="Já existe um aluno cadastrado com esta matrícula"
            )

    novo_aluno = Aluno(
        nome=aluno.nome,
        email=aluno.email,
        matricula=aluno.matricula,
        curso=aluno.curso,
        ativo=aluno.ativo
    )

    db.add(novo_aluno)
    db.commit()
    db.refresh(novo_aluno)

    return novo_aluno


@router.get("/", response_model=list[AlunoResponse])
def listar_alunos(db: Session = Depends(get_db)):
    return db.query(Aluno).all()


@router.get("/{aluno_id}", response_model=AlunoResponse)
def buscar_aluno(
    aluno_id: int,
    db: Session = Depends(get_db)
):
    aluno = (
        db.query(Aluno)
        .filter(Aluno.id == aluno_id)
        .first()
    )

    if not aluno:
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )

    return aluno


@router.delete("/{aluno_id}")
def deletar_aluno(
    aluno_id: int,
    db: Session = Depends(get_db)
):
    aluno = (
        db.query(Aluno)
        .filter(Aluno.id == aluno_id)
        .first()
    )

    if not aluno:
        raise HTTPException(
            status_code=404,
            detail="Aluno não encontrado"
        )

    db.delete(aluno)
    db.commit()

    return {"message": "Aluno deletado com sucesso"}