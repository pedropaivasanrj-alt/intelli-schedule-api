from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProjetoBase(BaseModel):
    nome: str
    resumo: str = Field(min_length=1)
    caracteristicas: str = Field(min_length=1)
    objetivo: Optional[str] = None
    descricao_foco: Optional[str] = None
    status: str = "Ativo"
    alunos_envolvidos: str = ""


class ProjetoCreate(ProjetoBase):
    orientador_id: int


class ProjetoUpdate(BaseModel):
    nome: Optional[str] = None
    resumo: Optional[str] = Field(default=None, min_length=1)
    caracteristicas: Optional[str] = Field(default=None, min_length=1)
    objetivo: Optional[str] = None
    descricao_foco: Optional[str] = None
    status: Optional[str] = None
    alunos_envolvidos: Optional[str] = None


class ProjetoProfessorVinculoCreate(BaseModel):
    papel_no_projeto: str = "orientador"


class ProjetoProfessorResponse(BaseModel):
    professor_id: int
    professor_nome: Optional[str] = None
    professor_email: Optional[str] = None
    papel_no_projeto: str


class ProjetoAlunoResponse(BaseModel):
    aluno_id: int
    aluno_nome: Optional[str] = None
    aluno_email: Optional[str] = None


class ProjetoResponse(ProjetoBase):
    id: int
    professores: list[ProjetoProfessorResponse] = []
    alunos: list[ProjetoAlunoResponse] = []

    model_config = ConfigDict(from_attributes=True)


class HistoricoReuniaoBase(BaseModel):
    reuniao_id: Optional[int] = None
    titulo: str = Field(min_length=1)
    resumo: str = Field(min_length=1)
    decisoes: Optional[str] = None
    pendencias: Optional[str] = None
    proximos_passos: Optional[str] = None


class HistoricoReuniaoCreate(HistoricoReuniaoBase):
    professor_id: Optional[int] = None


class HistoricoReuniaoUpdate(BaseModel):
    reuniao_id: Optional[int] = None
    professor_id: Optional[int] = None
    titulo: Optional[str] = Field(default=None, min_length=1)
    resumo: Optional[str] = Field(default=None, min_length=1)
    decisoes: Optional[str] = None
    pendencias: Optional[str] = None
    proximos_passos: Optional[str] = None


class HistoricoReuniaoResponse(HistoricoReuniaoBase):
    id: int
    projeto_id: int
    professor_id: Optional[int] = None
    professor_nome: Optional[str] = None
    data_registro: Optional[datetime] = None
    atualizado_em: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
