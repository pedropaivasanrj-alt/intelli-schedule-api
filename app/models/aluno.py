from sqlalchemy import Column, Integer, String, Boolean

from app.core.database import Base


class Aluno(Base):
    __tablename__ = "alunos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    matricula = Column(String, unique=True, index=True, nullable=True)
    curso = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)