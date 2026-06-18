from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_dependencies import obter_usuario_atual, obter_usuario_opcional
from app.core.database import get_db
from app.models.aluno import Aluno
from app.models.historico_reuniao import HistoricoReuniao
from app.models.professor import Professor
from app.models.projeto import Projeto
from app.models.projeto_professor import ProjetoProfessor
from app.models.reuniao import Reuniao
from app.models.usuario import Usuario
from app.schemas.projeto_schema import (
    HistoricoReuniaoCreate,
    HistoricoReuniaoResponse,
    HistoricoReuniaoUpdate,
    ProjetoCreate,
    ProjetoProfessorResponse,
    ProjetoProfessorVinculoCreate,
    ProjetoResponse,
    ProjetoUpdate,
)
from app.services.log_service import registrar_log

router = APIRouter(
    prefix="/api/v1/projetos",
    tags=["Projetos"]
)

PAPEIS_PROJETO_VALIDOS = {"orientador", "coorientador", "avaliador"}


def validar_papel_no_projeto(papel_no_projeto: str):
    if papel_no_projeto not in PAPEIS_PROJETO_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail="Papel no projeto deve ser orientador, coorientador ou avaliador"
        )


def buscar_projeto_ou_404(db: Session, projeto_id: int):
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


def buscar_professor_ou_404(db: Session, professor_id: int):
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


def validar_gestor_ou_legacy(usuario: Usuario | None):
    if usuario is None:
        return

    if usuario.papel not in ["admin", "coordenador"]:
        raise HTTPException(
            status_code=403,
            detail="Apenas admin ou coordenador podem executar esta ação"
        )


def obter_professor_do_usuario(db: Session, usuario: Usuario):
    return (
        db.query(Professor)
        .filter(Professor.usuario_id == usuario.id)
        .first()
    )


def professor_esta_vinculado(
    projeto: Projeto,
    professor_id: int,
    papel_no_projeto: str | None = None
):
    for vinculo in projeto.professor_vinculos:
        if vinculo.professor_id != professor_id:
            continue

        if papel_no_projeto is None:
            return True

        if vinculo.papel_no_projeto == papel_no_projeto:
            return True

    return False


def usuario_pode_ver_projeto(db: Session, usuario: Usuario, projeto: Projeto):
    if usuario.papel in ["admin", "coordenador"]:
        return True

    if usuario.papel == "professor":
        professor = obter_professor_do_usuario(db, usuario)
        return bool(
            professor and professor_esta_vinculado(projeto, professor.id)
        )

    if usuario.papel == "aluno":
        aluno = (
            db.query(Aluno)
            .filter(Aluno.usuario_id == usuario.id)
            .first()
        )
        return bool(aluno and aluno in projeto.alunos)

    return False


def usuario_pode_editar_projeto(
    db: Session,
    usuario: Usuario,
    projeto: Projeto
):
    if usuario.papel in ["admin", "coordenador"]:
        return True

    if usuario.papel == "professor":
        professor = obter_professor_do_usuario(db, usuario)
        return bool(
            professor and professor_esta_vinculado(projeto, professor.id)
        )

    return False


def validar_acesso_projeto(db: Session, usuario: Usuario, projeto: Projeto):
    if not usuario_pode_ver_projeto(db, usuario, projeto):
        raise HTTPException(
            status_code=403,
            detail="Usuário não possui acesso a este projeto"
        )


def validar_edicao_projeto(db: Session, usuario: Usuario, projeto: Projeto):
    if not usuario_pode_editar_projeto(db, usuario, projeto):
        raise HTTPException(
            status_code=403,
            detail="Usuário não pode editar este projeto"
        )


def formatar_projeto(projeto: Projeto):
    return {
        "id": projeto.id,
        "nome": projeto.nome,
        "resumo": projeto.resumo,
        "caracteristicas": projeto.caracteristicas,
        "objetivo": projeto.objetivo,
        "descricao_foco": projeto.descricao_foco,
        "status": projeto.status,
        "alunos_envolvidos": projeto.alunos_envolvidos or "",
        "professores": [
            {
                "professor_id": vinculo.professor_id,
                "professor_nome": (
                    vinculo.professor.nome
                    if vinculo.professor
                    else None
                ),
                "professor_email": (
                    vinculo.professor.email
                    if vinculo.professor
                    else None
                ),
                "papel_no_projeto": vinculo.papel_no_projeto,
            }
            for vinculo in projeto.professor_vinculos
        ],
        "alunos": [
            {
                "aluno_id": aluno.id,
                "aluno_nome": aluno.nome,
                "aluno_email": aluno.email,
            }
            for aluno in projeto.alunos
        ],
    }


def formatar_historico(historico: HistoricoReuniao):
    return {
        "id": historico.id,
        "projeto_id": historico.projeto_id,
        "reuniao_id": historico.reuniao_id,
        "professor_id": historico.professor_id,
        "professor_nome": (
            historico.professor.nome
            if historico.professor
            else None
        ),
        "titulo": historico.titulo,
        "resumo": historico.resumo,
        "decisoes": historico.decisoes,
        "pendencias": historico.pendencias,
        "proximos_passos": historico.proximos_passos,
        "data_registro": historico.data_registro,
        "atualizado_em": historico.atualizado_em,
    }


@router.post("/", response_model=ProjetoResponse)
def criar_projeto(
    projeto: ProjetoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
):
    validar_gestor_ou_legacy(usuario_atual)

    orientador = buscar_professor_ou_404(db, projeto.orientador_id)

    if not orientador.ativo:
        raise HTTPException(
            status_code=400,
            detail="O orientador precisa estar ativo"
        )

    novo_projeto = Projeto(
        nome=projeto.nome,
        resumo=projeto.resumo.strip(),
        caracteristicas=projeto.caracteristicas.strip(),
        objetivo=projeto.objetivo,
        alunos_envolvidos=projeto.alunos_envolvidos,
        descricao_foco=projeto.descricao_foco,
        status=projeto.status
    )

    db.add(novo_projeto)
    db.flush()

    db.add(
        ProjetoProfessor(
            projeto_id=novo_projeto.id,
            professor_id=orientador.id,
            papel_no_projeto="orientador"
        )
    )

    db.commit()
    db.refresh(novo_projeto)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="criar",
        recurso="projeto",
        detalhes=f"Projeto criado: {novo_projeto.nome}"
    )

    return formatar_projeto(novo_projeto)


@router.get("/", response_model=list[ProjetoResponse])
def listar_projetos(db: Session = Depends(get_db)):
    projetos = (
        db.query(Projeto)
        .order_by(Projeto.nome)
        .all()
    )

    return [formatar_projeto(projeto) for projeto in projetos]


@router.get("/{projeto_id}", response_model=ProjetoResponse)
def buscar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)

    if usuario_atual is not None:
        validar_acesso_projeto(db, usuario_atual, projeto)

    return formatar_projeto(projeto)


@router.put("/{projeto_id}", response_model=ProjetoResponse)
def atualizar_projeto(
    projeto_id: int,
    dados: ProjetoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    validar_edicao_projeto(db, usuario_atual, projeto)

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(projeto, campo, valor)

    db.commit()
    db.refresh(projeto)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="editar",
        recurso="projeto",
        detalhes=f"Projeto editado: {projeto.nome}"
    )

    return formatar_projeto(projeto)


@router.delete("/{projeto_id}")
def deletar_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
):
    validar_gestor_ou_legacy(usuario_atual)
    projeto = buscar_projeto_ou_404(db, projeto_id)

    db.delete(projeto)
    db.commit()

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="remover",
        recurso="projeto",
        detalhes=f"Projeto removido: {projeto.nome}"
    )

    return {"message": "Projeto deletado com sucesso"}


@router.post(
    "/{projeto_id}/professores/{professor_id}",
    response_model=ProjetoProfessorResponse
)
def vincular_professor_ao_projeto(
    projeto_id: int,
    professor_id: int,
    dados: ProjetoProfessorVinculoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
):
    validar_gestor_ou_legacy(usuario_atual)
    validar_papel_no_projeto(dados.papel_no_projeto)

    projeto = buscar_projeto_ou_404(db, projeto_id)
    professor = buscar_professor_ou_404(db, professor_id)

    vinculo = (
        db.query(ProjetoProfessor)
        .filter(ProjetoProfessor.projeto_id == projeto_id)
        .filter(ProjetoProfessor.professor_id == professor_id)
        .first()
    )

    if vinculo:
        vinculo.papel_no_projeto = dados.papel_no_projeto
    else:
        vinculo = ProjetoProfessor(
            projeto_id=projeto_id,
            professor_id=professor_id,
            papel_no_projeto=dados.papel_no_projeto
        )
        db.add(vinculo)

    db.commit()
    db.refresh(vinculo)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="vincular",
        recurso="projeto_professor",
        detalhes=(
            f"{professor.email} como {vinculo.papel_no_projeto} "
            f"em {projeto.nome}"
        )
    )

    return {
        "professor_id": professor.id,
        "professor_nome": professor.nome,
        "professor_email": professor.email,
        "papel_no_projeto": vinculo.papel_no_projeto,
    }


@router.get(
    "/{projeto_id}/professores",
    response_model=list[ProjetoProfessorResponse]
)
def listar_professores_do_projeto(
    projeto_id: int,
    db: Session = Depends(get_db)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    return formatar_projeto(projeto)["professores"]


@router.delete("/{projeto_id}/professores/{professor_id}")
def remover_professor_do_projeto(
    projeto_id: int,
    professor_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario | None = Depends(obter_usuario_opcional)
):
    validar_gestor_ou_legacy(usuario_atual)
    projeto = buscar_projeto_ou_404(db, projeto_id)

    vinculo = (
        db.query(ProjetoProfessor)
        .filter(ProjetoProfessor.projeto_id == projeto_id)
        .filter(ProjetoProfessor.professor_id == professor_id)
        .first()
    )

    if not vinculo:
        raise HTTPException(
            status_code=404,
            detail="Professor não está vinculado a este projeto"
        )

    if vinculo.papel_no_projeto == "orientador":
        total_orientadores = (
            db.query(ProjetoProfessor)
            .filter(ProjetoProfessor.projeto_id == projeto_id)
            .filter(ProjetoProfessor.papel_no_projeto == "orientador")
            .count()
        )

        if total_orientadores <= 1:
            raise HTTPException(
                status_code=400,
                detail="Não é permitido remover o último orientador do projeto"
            )

    db.delete(vinculo)
    db.commit()

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="remover",
        recurso="projeto_professor",
        detalhes=f"Professor {professor_id} removido de {projeto.nome}"
    )

    return {"message": "Professor removido do projeto com sucesso"}


@router.post("/{projeto_id}/alunos/{aluno_id}", response_model=ProjetoResponse)
def vincular_aluno_ao_projeto(
    projeto_id: int,
    aluno_id: int,
    db: Session = Depends(get_db)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)

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

    if aluno in projeto.alunos:
        raise HTTPException(
            status_code=400,
            detail="Aluno já está vinculado a este projeto"
        )

    projeto.alunos.append(aluno)

    db.commit()
    db.refresh(projeto)

    return formatar_projeto(projeto)


@router.get("/{projeto_id}/alunos")
def listar_alunos_do_projeto(
    projeto_id: int,
    db: Session = Depends(get_db)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    return projeto.alunos


@router.delete("/{projeto_id}/alunos/{aluno_id}")
def remover_aluno_do_projeto(
    projeto_id: int,
    aluno_id: int,
    db: Session = Depends(get_db)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)

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

    if aluno not in projeto.alunos:
        raise HTTPException(
            status_code=400,
            detail="Aluno não está vinculado a este projeto"
        )

    projeto.alunos.remove(aluno)

    db.commit()

    return {"message": "Aluno removido do projeto com sucesso"}


@router.get(
    "/{projeto_id}/historico",
    response_model=list[HistoricoReuniaoResponse]
)
def listar_historico_projeto(
    projeto_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    validar_acesso_projeto(db, usuario_atual, projeto)

    historicos = (
        db.query(HistoricoReuniao)
        .filter(HistoricoReuniao.projeto_id == projeto_id)
        .order_by(HistoricoReuniao.data_registro.desc())
        .all()
    )

    return [formatar_historico(historico) for historico in historicos]


@router.post(
    "/{projeto_id}/historico",
    response_model=HistoricoReuniaoResponse
)
def criar_historico_projeto(
    projeto_id: int,
    dados: HistoricoReuniaoCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    validar_edicao_projeto(db, usuario_atual, projeto)

    professor_id = dados.professor_id

    if usuario_atual.papel == "professor":
        professor = obter_professor_do_usuario(db, usuario_atual)

        if not professor or not professor_esta_vinculado(projeto, professor.id):
            raise HTTPException(
                status_code=403,
                detail="Professor não vinculado ao projeto"
            )

        professor_id = professor.id

    if professor_id is not None:
        buscar_professor_ou_404(db, professor_id)

    if dados.reuniao_id is not None:
        reuniao = (
            db.query(Reuniao)
            .filter(Reuniao.id == dados.reuniao_id)
            .filter(Reuniao.projeto_id == projeto_id)
            .first()
        )

        if not reuniao:
            raise HTTPException(
                status_code=404,
                detail="Reunião não encontrada neste projeto"
            )

    historico = HistoricoReuniao(
        projeto_id=projeto_id,
        reuniao_id=dados.reuniao_id,
        professor_id=professor_id,
        titulo=dados.titulo,
        resumo=dados.resumo,
        decisoes=dados.decisoes,
        pendencias=dados.pendencias,
        proximos_passos=dados.proximos_passos,
    )

    db.add(historico)
    db.commit()
    db.refresh(historico)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="criar",
        recurso="historico_reuniao",
        detalhes=f"Histórico criado no projeto {projeto.nome}"
    )

    return formatar_historico(historico)


@router.put(
    "/{projeto_id}/historico/{historico_id}",
    response_model=HistoricoReuniaoResponse
)
def atualizar_historico_projeto(
    projeto_id: int,
    historico_id: int,
    dados: HistoricoReuniaoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    projeto = buscar_projeto_ou_404(db, projeto_id)
    validar_edicao_projeto(db, usuario_atual, projeto)

    historico = (
        db.query(HistoricoReuniao)
        .filter(HistoricoReuniao.id == historico_id)
        .filter(HistoricoReuniao.projeto_id == projeto_id)
        .first()
    )

    if not historico:
        raise HTTPException(
            status_code=404,
            detail="Histórico não encontrado"
        )

    for campo, valor in dados.model_dump(exclude_unset=True).items():
        setattr(historico, campo, valor)

    db.commit()
    db.refresh(historico)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="editar",
        recurso="historico_reuniao",
        detalhes=f"Histórico editado no projeto {projeto.nome}"
    )

    return formatar_historico(historico)


@router.delete("/{projeto_id}/historico/{historico_id}")
def deletar_historico_projeto(
    projeto_id: int,
    historico_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    if usuario_atual.papel not in ["admin", "coordenador"]:
        raise HTTPException(
            status_code=403,
            detail="Apenas admin ou coordenador podem remover históricos"
        )

    projeto = buscar_projeto_ou_404(db, projeto_id)

    historico = (
        db.query(HistoricoReuniao)
        .filter(HistoricoReuniao.id == historico_id)
        .filter(HistoricoReuniao.projeto_id == projeto_id)
        .first()
    )

    if not historico:
        raise HTTPException(
            status_code=404,
            detail="Histórico não encontrado"
        )

    db.delete(historico)
    db.commit()

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="remover",
        recurso="historico_reuniao",
        detalhes=f"Histórico removido do projeto {projeto.nome}"
    )

    return {"message": "Histórico removido com sucesso"}
