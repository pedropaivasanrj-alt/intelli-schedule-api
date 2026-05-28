from pydantic import BaseModel, EmailStr
from typing import List

# Representa uma única linha da nossa planilha
class LinhaProjeto(BaseModel):
    nome_projeto: str
    alunos_envolvidos: str
    foco_avaliacao: str
    ciclo_avaliacao: str
    email_avaliador: EmailStr

# Representa o lote completo que será salvo
class LoteProjetos(BaseModel):
    projetos: List[LinhaProjeto]