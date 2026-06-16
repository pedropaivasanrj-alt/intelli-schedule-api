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