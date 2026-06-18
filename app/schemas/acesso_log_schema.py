from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class AcessoLogResponse(BaseModel):
    id: int
    usuario_id: Optional[int] = None
    usuario_email: Optional[str] = None
    papel: Optional[str] = None
    acao: str
    recurso: str
    detalhes: Optional[str] = None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)
