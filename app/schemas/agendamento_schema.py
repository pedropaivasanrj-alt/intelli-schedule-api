from datetime import datetime
from pydantic import BaseModel


class AgendamentoAlunoCreate(BaseModel):
    aluno_id: int
    projeto_id: int
    professor_id: int
    data_hora_inicio: datetime