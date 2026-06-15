from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.projeto_aluno import projeto_alunos


class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    alunos_envolvidos = Column(Text, nullable=True)
    descricao_foco = Column(Text, nullable=True)

    reunioes = relationship("Reuniao", back_populates="projeto")
    alunos = relationship(
        "Aluno",
        secondary=projeto_alunos,
        back_populates="projetos"
    )