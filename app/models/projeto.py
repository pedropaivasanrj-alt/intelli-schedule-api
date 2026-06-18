from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.projeto_aluno import projeto_alunos


class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    resumo = Column(Text, nullable=False)
    caracteristicas = Column(Text, nullable=False)
    objetivo = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="Ativo")
    alunos_envolvidos = Column(Text, nullable=True)
    descricao_foco = Column(Text, nullable=True)

    reunioes = relationship("Reuniao", back_populates="projeto")
    professor_vinculos = relationship(
        "ProjetoProfessor",
        back_populates="projeto",
        cascade="all, delete-orphan"
    )
    historicos = relationship(
        "HistoricoReuniao",
        back_populates="projeto",
        cascade="all, delete-orphan"
    )
    alunos = relationship(
        "Aluno",
        secondary=projeto_alunos,
        back_populates="projetos"
    )
