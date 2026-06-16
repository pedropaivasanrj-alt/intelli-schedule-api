from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependencies import obter_usuario_atual
from app.core.security import criar_token_acesso, verificar_senha
from app.models.usuario import Usuario
from app.schemas.auth_schema import LoginRequest, LoginResponse, UsuarioAutenticado

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