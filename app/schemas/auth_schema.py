from pydantic import BaseModel, EmailStr, ConfigDict


class LoginRequest(BaseModel):
    email: EmailStr
    senha: str


class UsuarioAutenticado(BaseModel):
    id: int
    nome: str
    email: EmailStr
    papel: str

    model_config = ConfigDict(from_attributes=True)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioAutenticado

class AlterarSenhaRequest(BaseModel):
    senha_atual: str
    nova_senha: str
    confirmar_nova_senha: str


class RecuperarSenhaRequest(BaseModel):
    email: EmailStr
    nova_senha: str
    confirmar_nova_senha: str


class MensagemResponse(BaseModel):
    message: str    