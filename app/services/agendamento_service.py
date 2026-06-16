from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.aluno import Aluno
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


def professor_tem_disponibilidade(
    db: Session,
    professor_id: int,
    inicio: datetime,
    fim: datetime
) -> bool:
    disponibilidade = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.professor_id == professor_id)
        .filter(Disponibilidade.data == inicio.date())
        .filter(Disponibilidade.hora_inicio <= inicio.time())
        .filter(Disponibilidade.hora_fim >= fim.time())
        .first()
    )

    return disponibilidade is not None


def listar_horarios_disponiveis(
    db: Session,
    data: date,
    professor_id: Optional[int] = None
):
    query = (
        db.query(Disponibilidade)
        .join(Professor)
        .filter(Professor.ativo == True)
        .filter(Disponibilidade.data == data)
        .order_by(
            Disponibilidade.data,
            Disponibilidade.hora_inicio
        )
    )

    if professor_id:
        query = query.filter(Disponibilidade.professor_id == professor_id)

    disponibilidades = query.all()

    horarios = []
    duracao = timedelta(minutes=DURACAO_PADRAO_REUNIAO_MINUTOS)

    for disponibilidade in disponibilidades:
        professor = (
            db.query(Professor)
            .filter(Professor.id == disponibilidade.professor_id)
            .first()
        )

        inicio_disponibilidade = datetime.combine(
            disponibilidade.data,
            disponibilidade.hora_inicio
        )

        fim_disponibilidade = datetime.combine(
            disponibilidade.data,
            disponibilidade.hora_fim
        )

        inicio_atual = inicio_disponibilidade

        while inicio_atual + duracao <= fim_disponibilidade:
            fim_atual = inicio_atual + duracao

            if not horario_tem_conflito(
                db=db,
                professor_id=disponibilidade.professor_id,
                inicio=inicio_atual,
                fim=fim_atual
            ):
                horarios.append({
                    "professor_id": disponibilidade.professor_id,
                    "professor_nome": professor.nome if professor else None,
                    "data_hora_inicio": inicio_atual,
                    "data_hora_fim": fim_atual
                })

            inicio_atual += duracao

    return horarios


def agendar_reuniao_por_aluno(
    db: Session,
    aluno_id: int,
    projeto_id: int,
    professor_id: int,
    data_hora_inicio: datetime
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

    if not professor.ativo:
        raise HTTPException(
            status_code=400,
            detail="Professor está inativo"
        )

    if aluno not in projeto.alunos:
        raise HTTPException(
            status_code=400,
            detail="Aluno não está vinculado a este projeto"
        )

    reuniao_existente_projeto = (
        db.query(Reuniao)
        .filter(Reuniao.projeto_id == projeto_id)
        .first()
    )

    if reuniao_existente_projeto:
        raise HTTPException(
            status_code=400,
            detail="Este projeto já possui uma reunião agendada"
        )

    duracao = timedelta(minutes=DURACAO_PADRAO_REUNIAO_MINUTOS)
    data_hora_fim = data_hora_inicio + duracao

    if not professor_tem_disponibilidade(
        db=db,
        professor_id=professor_id,
        inicio=data_hora_inicio,
        fim=data_hora_fim
    ):
        raise HTTPException(
            status_code=400,
            detail="Professor não possui disponibilidade neste horário"
        )

    if horario_tem_conflito(
        db=db,
        professor_id=professor_id,
        inicio=data_hora_inicio,
        fim=data_hora_fim
    ):
        raise HTTPException(
            status_code=400,
            detail="Professor já possui reunião neste horário"
        )

    nova_reuniao = Reuniao(
        projeto_id=projeto_id,
        professor_id=professor_id,
        aluno_id=aluno_id,
        ciclo_avaliacao="Agendamento realizado pelo aluno",
        data_hora_inicio=data_hora_inicio,
        data_hora_fim=data_hora_fim,
        status="Agendado"
    )

    db.add(nova_reuniao)
    db.commit()
    db.refresh(nova_reuniao)

    return formatar_reuniao(db, nova_reuniao)


def gerar_agendamentos_automaticos(db: Session):
    projetos = db.query(Projeto).order_by(Projeto.id).all()

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

    duracao = timedelta(minutes=DURACAO_PADRAO_REUNIAO_MINUTOS)

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
            inicio_disponibilidade = datetime.combine(
                disponibilidade.data,
                disponibilidade.hora_inicio
            )

            fim_disponibilidade = datetime.combine(
                disponibilidade.data,
                disponibilidade.hora_fim
            )

            inicio_atual = inicio_disponibilidade

            while inicio_atual + duracao <= fim_disponibilidade:
                fim_atual = inicio_atual + duracao

                if not horario_tem_conflito(
                    db=db,
                    professor_id=disponibilidade.professor_id,
                    inicio=inicio_atual,
                    fim=fim_atual
                ):
                    nova_reuniao = Reuniao(
                        projeto_id=projeto.id,
                        professor_id=disponibilidade.professor_id,
                        aluno_id=None,
                        ciclo_avaliacao="Agendamento automático",
                        data_hora_inicio=inicio_atual,
                        data_hora_fim=fim_atual,
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

                inicio_atual += duracao

            if projeto_agendado:
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

    aluno = None

    if reuniao.aluno_id:
        aluno = (
            db.query(Aluno)
            .filter(Aluno.id == reuniao.aluno_id)
            .first()
        )

    return {
        "reuniao_id": reuniao.id,
        "projeto_id": reuniao.projeto_id,
        "projeto_nome": projeto.nome if projeto else None,
        "professor_id": reuniao.professor_id,
        "professor_nome": professor.nome if professor else None,
        "aluno_id": reuniao.aluno_id,
        "aluno_nome": aluno.nome if aluno else None,
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