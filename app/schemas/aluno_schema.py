from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class AlunoBase(BaseModel):
    nome: str
    email: EmailStr
    matricula: Optional[str] = None
    curso: Optional[str] = None
    ativo: bool = True
    usuario_id: Optional[int] = None


class AlunoCreate(AlunoBase):
    pass


class AlunoResponse(AlunoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)