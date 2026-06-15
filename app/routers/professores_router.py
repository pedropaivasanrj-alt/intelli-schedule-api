from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.professor import Professor
from app.models.usuario import Usuario
from app.schemas.professor_schema import ProfessorCreate, ProfessorResponse

router = APIRouter(
    prefix="/api/v1/professores",
    tags=["Professores"]
)


@router.post("/", response_model=ProfessorResponse)
def criar_professor(
    professor: ProfessorCreate,
    db: Session = Depends(get_db)
):
    professor_existente = (
        db.query(Professor)
        .filter(Professor.email == professor.email)
        .first()
    )

    if professor_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um professor cadastrado com este e-mail"
        )

    if professor.usuario_id:
        usuario = (
            db.query(Usuario)
            .filter(Usuario.id == professor.usuario_id)
            .first()
        )

        if not usuario:
            raise HTTPException(
                status_code=404,
                detail="Usuário não encontrado"
            )

        if usuario.papel != "professor":
            raise HTTPException(
                status_code=400,
                detail="O usuário vinculado precisa ter papel de professor"
            )

        vinculo_existente = (
            db.query(Professor)
            .filter(Professor.usuario_id == professor.usuario_id)
            .first()
        )

        if vinculo_existente:
            raise HTTPException(
                status_code=400,
                detail="Este usuário já está vinculado a um professor"
            )

    novo_professor = Professor(
        nome=professor.nome,
        email=professor.email,
        departamento=professor.departamento,
        ativo=professor.ativo,
        usuario_id=professor.usuario_id
    )

    db.add(novo_professor)
    db.commit()
    db.refresh(novo_professor)

    return novo_professor


@router.get("/", response_model=list[ProfessorResponse])
def listar_professores(db: Session = Depends(get_db)):
    return db.query(Professor).all()


@router.get("/{professor_id}", response_model=ProfessorResponse)
def buscar_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    professor = (
        db.query(Professor)
        .filter(Professor.id == professor_id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado"
        )

    return professor


@router.delete("/{professor_id}")
def deletar_professor(
    professor_id: int,
    db: Session = Depends(get_db)
):
    professor = (
        db.query(Professor)
        .filter(Professor.id == professor_id)
        .first()
    )

    if not professor:
        raise HTTPException(
            status_code=404,
            detail="Professor não encontrado"
        )

    db.delete(professor)
    db.commit()

    return {"message": "Professor deletado com sucesso"}