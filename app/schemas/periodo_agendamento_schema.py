from datetime import date
from typing import Optional

from pydantic import BaseModel, ConfigDict


class PeriodoAgendamentoBase(BaseModel):
    titulo: str
    descricao: Optional[str] = None
    data_inicio: date
    data_fim: date
    ativo: bool = True


class PeriodoAgendamentoCreate(PeriodoAgendamentoBase):
    pass


class PeriodoAgendamentoUpdate(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    ativo: Optional[bool] = None


class PeriodoAgendamentoResponse(PeriodoAgendamentoBase):
    id: int
    criado_por_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class MensagemResponse(BaseModel):
    message: str