import os
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

import jwt


JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "chave-local-de-desenvolvimento"
)
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440")
)


def gerar_hash_senha(senha: str) -> str:
    salt = secrets.token_hex(16)
    senha_hash = hashlib.pbkdf2_hmac(
        "sha256",
        senha.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()

    return f"{salt}:{senha_hash}"


def verificar_senha(senha: str, senha_hash_salvo: str) -> bool:
    salt, senha_hash = senha_hash_salvo.split(":")

    novo_hash = hashlib.pbkdf2_hmac(
        "sha256",
        senha.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()

    return secrets.compare_digest(novo_hash, senha_hash)


def criar_token_acesso(dados: dict) -> str:
    payload = dados.copy()

    expiracao = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload.update({"exp": expiracao})

    token = jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM
    )

    return token


def decodificar_token(token: str) -> dict:
    return jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM]
    )