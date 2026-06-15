import hashlib
import secrets


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