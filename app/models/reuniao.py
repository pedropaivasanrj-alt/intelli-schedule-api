from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Reuniao(Base):
    __tablename__ = "reunioes"

    id = Column(Integer, primary_key=True, index=True)

    projeto_id = Column(
        Integer,
        ForeignKey("projetos.id", ondelete="CASCADE"),
        nullable=False
    )

    professor_id = Column(
        Integer,
        ForeignKey("professores.id", ondelete="CASCADE"),
        nullable=False
    )

    aluno_id = Column(
        Integer,
        ForeignKey("alunos.id", ondelete="SET NULL"),
        nullable=True
    )

    ciclo_avaliacao = Column(String, nullable=False)
    data_hora_inicio = Column(DateTime, nullable=False)
    data_hora_fim = Column(DateTime, nullable=False)
    status = Column(String, default="Agendado")

    projeto = relationship("Projeto", back_populates="reunioes")
    professor = relationship("Professor", back_populates="reunioes")
    aluno = relationship("Aluno", back_populates="reunioes")