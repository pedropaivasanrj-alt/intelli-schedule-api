from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_dependencies import (
    exigir_papeis,
    obter_usuario_opcional,
)
from app.core.database import get_db
from app.models.aluno import Aluno
from app.models.usuario import Usuario
from app.schemas.aluno_schema import AlunoAtivoUpdate, AlunoCreate, AlunoResponse
from app.services.log_service import registrar_log

router = APIRouter(
    prefix="/api/v1/alunos",
    tags=["Alunos"]
)


@router.post("/", response_model=AlunoResponse)
def criar_aluno(
    aluno: AlunoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
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

    if aluno.usuario_id:
        usuario = (
            db.query(Usuario)
            .filter(Usuario.id == aluno.usuario_id)
            .first()
        )

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        if usuario.papel != "aluno":
            raise HTTPException(
                status_code=400,
                detail="O usuário vinculado precisa ter papel de aluno"
            )

        vinculo_existente = (
            db.query(Aluno)
            .filter(Aluno.usuario_id == aluno.usuario_id)
            .first()
        )

        if vinculo_existente:
            raise HTTPException(
                status_code=400,
                detail="Este usuário já está vinculado a um aluno"
            )

    novo_aluno = Aluno(
        nome=aluno.nome,
        email=aluno.email,
        matricula=aluno.matricula,
        curso=aluno.curso,
        ativo=aluno.ativo,
        usuario_id=aluno.usuario_id
    )

    db.add(novo_aluno)
    db.commit()
    db.refresh(novo_aluno)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="criar",
        recurso="aluno",
        detalhes=f"Aluno criado: {novo_aluno.email}"
    )

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


@router.patch("/{aluno_id}/ativo", response_model=AlunoResponse)
def atualizar_ativo_aluno(
    aluno_id: int,
    dados: AlunoAtivoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
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

    aluno.ativo = dados.ativo

    db.commit()
    db.refresh(aluno)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="ativar" if dados.ativo else "desativar",
        recurso="aluno",
        detalhes=f"Aluno: {aluno.email}"
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
