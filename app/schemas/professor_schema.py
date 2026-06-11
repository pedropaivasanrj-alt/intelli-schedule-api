from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict


class ProfessorBase(BaseModel):
    nome: str
    email: EmailStr
    departamento: Optional[str] = None
    ativo: bool = True


class ProfessorCreate(ProfessorBase):
    pass


class ProfessorResponse(ProfessorBase):
    id: int

    model_config = ConfigDict(from_attributes=True)