from datetime import date, time
from pydantic import BaseModel, ConfigDict


class DisponibilidadeBase(BaseModel):
    professor_id: int
    data: date
    hora_inicio: time
    hora_fim: time


class DisponibilidadeCreate(DisponibilidadeBase):
    pass


class DisponibilidadeResponse(DisponibilidadeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)