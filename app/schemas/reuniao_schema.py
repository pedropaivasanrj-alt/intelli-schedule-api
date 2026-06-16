from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class ReuniaoBase(BaseModel):
    projeto_id: int
    professor_id: int
    aluno_id: Optional[int] = None
    ciclo_avaliacao: str
    data_hora_inicio: datetime
    data_hora_fim: datetime
    status: str = "Agendado"


class ReuniaoCreate(ReuniaoBase):
    pass


class ReuniaoStatusUpdate(BaseModel):
    status: str


class ReuniaoResponse(ReuniaoBase):
    id: int

    model_config = ConfigDict(from_attributes=True)