from pydantic import BaseModel, ConfigDict


class DisponibilidadeBase(BaseModel):
    professor_id: int
    dia_semana: str
    hora_inicio: str
    hora_fim: str


class DisponibilidadeCreate(DisponibilidadeBase):
    pass


class DisponibilidadeResponse(DisponibilidadeBase):
    id: int

    model_config = ConfigDict(from_attributes=True)