from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.projeto_aluno import projeto_alunos


class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )

    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    matricula = Column(String, unique=True, index=True, nullable=True)
    curso = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)

    usuario = relationship("Usuario", back_populates="aluno")
    projetos = relationship(
        "Projeto",
        secondary=projeto_alunos,
        back_populates="alunos"
    )