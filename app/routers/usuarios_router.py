from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_dependencies import exigir_papeis
from app.core.database import get_db
from app.core.security import gerar_hash_senha
from app.models.acesso_log import AcessoLog
from app.models.usuario import Usuario
from app.schemas.acesso_log_schema import AcessoLogResponse
from app.schemas.usuario_schema import (
    CoordenadorCreate,
    UsuarioAtivoUpdate,
    UsuarioCreate,
    UsuarioResponse,
)
from app.services.log_service import registrar_log

router = APIRouter(
    prefix="/api/v1/usuarios",
    tags=["Usuários"]
)


@router.post("/", response_model=UsuarioResponse)
def criar_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.email == usuario.email)
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário cadastrado com este e-mail"
        )

    if usuario.papel == "admin":
        admin_existente = (
            db.query(Usuario)
            .filter(Usuario.papel == "admin")
            .first()
        )

        if admin_existente:
            raise HTTPException(
                status_code=400,
                detail="Já existe um ADM cadastrado no sistema"
            )

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=gerar_hash_senha(usuario.senha),
        papel=usuario.papel,
        ativo=usuario.ativo
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return novo_usuario


@router.get("/coordenadores", response_model=list[UsuarioResponse])
def listar_coordenadores(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_papeis(["admin"]))
):
    return (
        db.query(Usuario)
        .filter(Usuario.papel == "coordenador")
        .order_by(Usuario.nome)
        .all()
    )


@router.post("/coordenadores", response_model=UsuarioResponse)
def criar_coordenador(
    coordenador: CoordenadorCreate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_papeis(["admin"]))
):
    usuario_existente = (
        db.query(Usuario)
        .filter(Usuario.email == coordenador.email)
        .first()
    )

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="Já existe um usuário cadastrado com este e-mail"
        )

    novo_coordenador = Usuario(
        nome=coordenador.nome,
        email=coordenador.email,
        senha_hash=gerar_hash_senha(coordenador.senha),
        papel="coordenador",
        ativo=coordenador.ativo
    )

    db.add(novo_coordenador)
    db.commit()
    db.refresh(novo_coordenador)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="criar",
        recurso="coordenador",
        detalhes=f"Coordenador criado: {novo_coordenador.email}"
    )

    return novo_coordenador


@router.delete("/coordenadores/{usuario_id}")
def remover_coordenador(
    usuario_id: int,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_papeis(["admin"]))
):
    coordenador = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .filter(Usuario.papel == "coordenador")
        .first()
    )

    if not coordenador:
        raise HTTPException(
            status_code=404,
            detail="Coordenador não encontrado"
        )

    email = coordenador.email
    db.delete(coordenador)
    db.commit()

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="remover",
        recurso="coordenador",
        detalhes=f"Coordenador removido: {email}"
    )

    return {"message": "Coordenador removido com sucesso"}


@router.get("/logs", response_model=list[AcessoLogResponse])
def listar_logs(
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_papeis(["admin"]))
):
    return (
        db.query(AcessoLog)
        .order_by(AcessoLog.criado_em.desc(), AcessoLog.id.desc())
        .limit(100)
        .all()
    )


@router.get("/", response_model=list[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()


@router.get("/{usuario_id}", response_model=UsuarioResponse)
def buscar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    return usuario


@router.patch("/{usuario_id}/ativo", response_model=UsuarioResponse)
def atualizar_ativo_usuario(
    usuario_id: int,
    dados: UsuarioAtivoUpdate,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(exigir_papeis(["admin"]))
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    if usuario.papel == "admin" and usuario.id == usuario_atual.id:
        raise HTTPException(
            status_code=400,
            detail="O administrador não pode desativar o próprio acesso"
        )

    usuario.ativo = dados.ativo

    db.commit()
    db.refresh(usuario)

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="ativar" if dados.ativo else "desativar",
        recurso="usuario",
        detalhes=f"Usuário: {usuario.email}"
    )

    return usuario


@router.delete("/{usuario_id}")
def deletar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == usuario_id)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuário não encontrado"
        )

    db.delete(usuario)
    db.commit()

    return {"message": "Usuário deletado com sucesso"}
