from enum import Enum
from pydantic import BaseModel, EmailStr, ConfigDict


class PapelUsuario(str, Enum):
    admin = "admin"
    coordenador = "coordenador"
    professor = "professor"
    aluno = "aluno"


class UsuarioBase(BaseModel):
    nome: str
    email: EmailStr
    papel: PapelUsuario
    ativo: bool = True


class UsuarioCreate(UsuarioBase):
    senha: str


class CoordenadorCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    ativo: bool = True


class UsuarioAtivoUpdate(BaseModel):
    ativo: bool


class UsuarioResponse(UsuarioBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
