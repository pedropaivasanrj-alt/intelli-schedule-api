from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependencies import obter_usuario_atual
from app.core.security import criar_token_acesso, verificar_senha, gerar_hash_senha
from app.models.usuario import Usuario
from app.schemas.auth_schema import (
    AlterarSenhaRequest,
    LoginRequest,
    LoginResponse,
    MensagemResponse,
    RecuperarSenhaRequest,
    UsuarioAutenticado,
)
from app.services.log_service import registrar_log

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["Autenticação"]
)


@router.post("/login", response_model=LoginResponse)
def login(
    dados: LoginRequest,
    db: Session = Depends(get_db)
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == dados.email)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    senha_valida = verificar_senha(
        dados.senha,
        usuario.senha_hash
    )

    if not senha_valida:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha inválidos"
        )

    token = criar_token_acesso({
        "sub": str(usuario.id),
        "email": usuario.email,
        "papel": usuario.papel
    })

    registrar_log(
        db=db,
        usuario=usuario,
        acao="login",
        recurso="auth",
        detalhes="Login realizado com sucesso"
    )

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": usuario
    }


@router.get("/me", response_model=UsuarioAutenticado)
def obter_meu_usuario(
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    return usuario_atual
@router.post("/alterar-senha", response_model=MensagemResponse)
def alterar_senha(
    dados: AlterarSenhaRequest,
    db: Session = Depends(get_db),
    usuario_atual: Usuario = Depends(obter_usuario_atual)
):
    if dados.nova_senha != dados.confirmar_nova_senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha e a confirmação não conferem"
        )

    if len(dados.nova_senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 6 caracteres"
        )

    senha_atual_valida = verificar_senha(
        dados.senha_atual,
        usuario_atual.senha_hash
    )

    if not senha_atual_valida:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )

    usuario_atual.senha_hash = gerar_hash_senha(dados.nova_senha)

    db.commit()

    registrar_log(
        db=db,
        usuario=usuario_atual,
        acao="alterar_senha",
        recurso="auth",
        detalhes="Usuário alterou a própria senha"
    )

    return {
        "message": "Senha alterada com sucesso"
    }


@router.post("/recuperar-senha", response_model=MensagemResponse)
def recuperar_senha(
    dados: RecuperarSenhaRequest,
    db: Session = Depends(get_db)
):
    if dados.nova_senha != dados.confirmar_nova_senha:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha e a confirmação não conferem"
        )

    if len(dados.nova_senha) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 6 caracteres"
        )

    usuario = (
        db.query(Usuario)
        .filter(Usuario.email == dados.email)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado com este e-mail"
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    usuario.senha_hash = gerar_hash_senha(dados.nova_senha)

    db.commit()

    registrar_log(
        db=db,
        usuario=usuario,
        acao="recuperar_senha",
        recurso="auth",
        detalhes="Senha redefinida pela tela de recuperação"
    )

    return {
        "message": "Senha redefinida com sucesso. Você já pode entrar com a nova senha."
    }