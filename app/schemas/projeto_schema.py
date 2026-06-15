from typing import Optional
from pydantic import BaseModel, ConfigDict


class ProjetoBase(BaseModel):
    nome: str
    alunos_envolvidos: str
    descricao_foco: Optional[str] = None


class ProjetoCreate(ProjetoBase):
    pass


class ProjetoResponse(ProjetoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)