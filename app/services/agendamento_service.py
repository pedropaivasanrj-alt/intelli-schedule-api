from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.projeto import Projeto
from app.models.professor import Professor
from app.models.disponibilidade import Disponibilidade
from app.models.reuniao import Reuniao


DURACAO_PADRAO_REUNIAO_MINUTOS = 60


def horario_tem_conflito(
    db: Session,
    professor_id: int,
    inicio: datetime,
    fim: datetime
) -> bool:
    conflito = (
        db.query(Reuniao)
        .filter(Reuniao.professor_id == professor_id)
        .filter(Reuniao.data_hora_inicio < fim)
        .filter(Reuniao.data_hora_fim > inicio)
        .first()
    )

    return conflito is not None


def gerar_agendamentos_automaticos(db: Session):
    projetos = db.query(Projeto).all()
    disponibilidades = (
        db.query(Disponibilidade)
        .join(Professor)
        .filter(Professor.ativo == True)
        .order_by(
            Disponibilidade.data,
            Disponibilidade.hora_inicio
        )
        .all()
    )

    agendados = []
    nao_agendados = []

    for projeto in projetos:
        reuniao_existente = (
            db.query(Reuniao)
            .filter(Reuniao.projeto_id == projeto.id)
            .first()
        )

        if reuniao_existente:
            continue

        projeto_agendado = False

        for disponibilidade in disponibilidades:
            inicio = datetime.combine(
                disponibilidade.data,
                disponibilidade.hora_inicio
            )

            fim = inicio + timedelta(
                minutes=DURACAO_PADRAO_REUNIAO_MINUTOS
            )

            limite_fim = datetime.combine(
                disponibilidade.data,
                disponibilidade.hora_fim
            )

            if fim > limite_fim:
                continue

            if horario_tem_conflito(
                db=db,
                professor_id=disponibilidade.professor_id,
                inicio=inicio,
                fim=fim
            ):
                continue

            nova_reuniao = Reuniao(
                projeto_id=projeto.id,
                professor_id=disponibilidade.professor_id,
                ciclo_avaliacao="Agendamento automático",
                data_hora_inicio=inicio,
                data_hora_fim=fim,
                status="Agendado"
            )

            db.add(nova_reuniao)
            db.commit()
            db.refresh(nova_reuniao)

            agendados.append({
                "projeto_id": projeto.id,
                "projeto_nome": projeto.nome,
                "professor_id": disponibilidade.professor_id,
                "reuniao_id": nova_reuniao.id,
                "inicio": nova_reuniao.data_hora_inicio,
                "fim": nova_reuniao.data_hora_fim,
                "status": nova_reuniao.status
            })

            projeto_agendado = True
            break

        if not projeto_agendado:
            nao_agendados.append({
                "projeto_id": projeto.id,
                "projeto_nome": projeto.nome,
                "motivo": "Sem disponibilidade válida encontrada"
            })

    return {
        "total_agendados": len(agendados),
        "total_nao_agendados": len(nao_agendados),
        "agendados": agendados,
        "nao_agendados": nao_agendados
    }
def formatar_reuniao(db: Session, reuniao: Reuniao):
    professor = (
        db.query(Professor)
        .filter(Professor.id == reuniao.professor_id)
        .first()
    )

    projeto = (
        db.query(Projeto)
        .filter(Projeto.id == reuniao.projeto_id)
        .first()
    )

    return {
        "reuniao_id": reuniao.id,
        "projeto_id": reuniao.projeto_id,
        "projeto_nome": projeto.nome if projeto else None,
        "professor_id": reuniao.professor_id,
        "professor_nome": professor.nome if professor else None,
        "ciclo_avaliacao": reuniao.ciclo_avaliacao,
        "data_hora_inicio": reuniao.data_hora_inicio,
        "data_hora_fim": reuniao.data_hora_fim,
        "status": reuniao.status
    }


def listar_agenda_completa(db: Session):
    reunioes = (
        db.query(Reuniao)
        .order_by(Reuniao.data_hora_inicio)
        .all()
    )

    return [formatar_reuniao(db, reuniao) for reuniao in reunioes]


def listar_agenda_por_professor(db: Session, professor_id: int):
    professor = (
        db.query(Professor)
        .filter(Professor.id == professor_id)
        .first()
    )

    if not professor:
        return None

    reunioes = (
        db.query(Reuniao)
        .filter(Reuniao.professor_id == professor_id)
        .order_by(Reuniao.data_hora_inicio)
        .all()
    )

    return {
        "professor_id": professor.id,
        "professor_nome": professor.nome,
        "reunioes": [formatar_reuniao(db, reuniao) for reuniao in reunioes]
    }


def listar_agenda_por_aluno(db: Session, aluno_id: int):
    from app.models.aluno import Aluno

    aluno = (
        db.query(Aluno)
        .filter(Aluno.id == aluno_id)
        .first()
    )

    if not aluno:
        return None

    projeto_ids = [projeto.id for projeto in aluno.projetos]

    reunioes = (
        db.query(Reuniao)
        .filter(Reuniao.projeto_id.in_(projeto_ids))
        .order_by(Reuniao.data_hora_inicio)
        .all()
    )

    return {
        "aluno_id": aluno.id,
        "aluno_nome": aluno.nome,
        "projetos": [
            {
                "projeto_id": projeto.id,
                "projeto_nome": projeto.nome
            }
            for projeto in aluno.projetos
        ],
        "reunioes": [formatar_reuniao(db, reuniao) for reuniao in reunioes]
    }