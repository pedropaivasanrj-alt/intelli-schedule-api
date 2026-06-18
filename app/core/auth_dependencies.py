from fastapi import Depends, HTTPException, status
from typing import Optional

from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
import jwt

from app.core.database import get_db
from app.core.security import decodificar_token
from app.models.usuario import Usuario


http_bearer = HTTPBearer()
http_bearer_optional = HTTPBearer(auto_error=False)


def obter_usuario_atual(
    credentials: HTTPAuthorizationCredentials = Depends(http_bearer),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = decodificar_token(token)
        usuario_id = payload.get("sub")

        if usuario_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido"
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expirado"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == int(usuario_id))
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário não encontrado"
        )

    if not usuario.ativo:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuário inativo"
        )

    return usuario


def exigir_papeis(papeis_permitidos: list[str]):
    def dependencia(usuario_atual: Usuario = Depends(obter_usuario_atual)):
        if usuario_atual.papel not in papeis_permitidos:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acesso não autorizado para este perfil"
            )

        return usuario_atual

    return dependencia


def obter_usuario_opcional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        http_bearer_optional
    ),
    db: Session = Depends(get_db)
):
    if credentials is None:
        return None

    token = credentials.credentials

    try:
        payload = decodificar_token(token)
        usuario_id = payload.get("sub")

        if usuario_id is None:
            return None

    except jwt.InvalidTokenError:
        return None

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id == int(usuario_id))
        .first()
    )

    if not usuario or not usuario.ativo:
        return None

    return usuario
