from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependencies import exigir_papeis
from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.aluno import Aluno
from app.models.projeto import Projeto
from app.models.reuniao import Reuniao

router = APIRouter(
    prefix="/api/v1/dashboard",
    tags=["Dashboard"]
)


@router.get("/resumo")
def obter_resumo_dashboard(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    total_professores = db.query(Professor).count()
    total_alunos = db.query(Aluno).count()
    total_projetos = db.query(Projeto).count()
    total_reunioes = db.query(Reuniao).count()

    projetos_com_reuniao = (
        db.query(Reuniao.projeto_id)
        .distinct()
        .all()
    )

    projetos_com_reuniao_ids = [
        item[0]
        for item in projetos_com_reuniao
    ]

    total_projetos_sem_agendamento = (
        db.query(Projeto)
        .filter(~Projeto.id.in_(projetos_com_reuniao_ids))
        .count()
        if projetos_com_reuniao_ids
        else total_projetos
    )

    return {
        "usuario": {
            "id": usuario_atual.id,
            "nome": usuario_atual.nome,
            "papel": usuario_atual.papel
        },
        "indicadores": {
            "professores": total_professores,
            "alunos": total_alunos,
            "projetos": total_projetos,
            "reunioes_agendadas": total_reunioes,
            "projetos_sem_agendamento": total_projetos_sem_agendamento
        }
    }