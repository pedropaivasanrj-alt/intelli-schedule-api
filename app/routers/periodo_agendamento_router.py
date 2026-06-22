from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth_dependencies import obter_usuario_atual, exigir_papeis
from app.core.database import get_db
from app.models.periodo_agendamento import PeriodoAgendamento
from app.models.usuario import Usuario
from app.schemas.periodo_agendamento_schema import (
    MensagemResponse,
    PeriodoAgendamentoCreate,
    PeriodoAgendamentoResponse,
    PeriodoAgendamentoUpdate,
)

router = APIRouter(
    prefix="/api/v1/periodos-agendamento",
    tags=["Períodos de Agendamento"]
)


def validar_datas(data_inicio, data_fim):
    if data_fim < data_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A data final não pode ser menor que a data inicial"
        )


def desativar_periodos_ativos(db: Session):
    periodos_ativos = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.ativo == True)
        .all()
    )

    for periodo in periodos_ativos:
        periodo.ativo = False


@router.post("/", response_model=PeriodoAgendamentoResponse)
def criar_periodo_agendamento(
    dados: PeriodoAgendamentoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    validar_datas(dados.data_inicio, dados.data_fim)

    if dados.ativo:
        desativar_periodos_ativos(db)

    periodo = PeriodoAgendamento(
        titulo=dados.titulo,
        descricao=dados.descricao,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        ativo=dados.ativo,
        criado_por_id=usuario_atual.id
    )

    db.add(periodo)
    db.commit()
    db.refresh(periodo)

    return periodo


@router.get("/", response_model=list[PeriodoAgendamentoResponse])
def listar_periodos_agendamento(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    return (
        db.query(PeriodoAgendamento)
        .order_by(PeriodoAgendamento.data_inicio.desc())
        .all()
    )


@router.get("/ativo", response_model=PeriodoAgendamentoResponse)
def obter_periodo_ativo(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.ativo == True)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Não existe período de agendamento ativo no momento"
        )

    return periodo


@router.get("/{periodo_id}", response_model=PeriodoAgendamentoResponse)
def obter_periodo_por_id(
    periodo_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.id == periodo_id)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período de agendamento não encontrado"
        )

    return periodo


@router.put("/{periodo_id}", response_model=PeriodoAgendamentoResponse)
def atualizar_periodo_agendamento(
    periodo_id: int,
    dados: PeriodoAgendamentoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.id == periodo_id)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período de agendamento não encontrado"
        )

    if dados.titulo is not None:
        periodo.titulo = dados.titulo

    if dados.descricao is not None:
        periodo.descricao = dados.descricao

    if dados.data_inicio is not None:
        periodo.data_inicio = dados.data_inicio

    if dados.data_fim is not None:
        periodo.data_fim = dados.data_fim

    if dados.ativo is not None:
        periodo.ativo = dados.ativo

    validar_datas(periodo.data_inicio, periodo.data_fim)

    if periodo.ativo:
        outros_periodos = (
            db.query(PeriodoAgendamento)
            .filter(PeriodoAgendamento.id != periodo.id)
            .filter(PeriodoAgendamento.ativo == True)
            .all()
        )

        for outro in outros_periodos:
            outro.ativo = False

    db.commit()
    db.refresh(periodo)

    return periodo


@router.patch("/{periodo_id}/ativar", response_model=PeriodoAgendamentoResponse)
def ativar_periodo_agendamento(
    periodo_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.id == periodo_id)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período de agendamento não encontrado"
        )

    desativar_periodos_ativos(db)

    periodo.ativo = True

    db.commit()
    db.refresh(periodo)

    return periodo


@router.patch("/{periodo_id}/encerrar", response_model=PeriodoAgendamentoResponse)
def encerrar_periodo_agendamento(
    periodo_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.id == periodo_id)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período de agendamento não encontrado"
        )

    periodo.ativo = False

    db.commit()
    db.refresh(periodo)

    return periodo


@router.delete("/{periodo_id}", response_model=MensagemResponse)
def deletar_periodo_agendamento(
    periodo_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(
        exigir_papeis(["admin", "coordenador"])
    )
):
    periodo = (
        db.query(PeriodoAgendamento)
        .filter(PeriodoAgendamento.id == periodo_id)
        .first()
    )

    if not periodo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Período de agendamento não encontrado"
        )

    db.delete(periodo)
    db.commit()

    return {
        "message": "Período de agendamento removido com sucesso"
    }