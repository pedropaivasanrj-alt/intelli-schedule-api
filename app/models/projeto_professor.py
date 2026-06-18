from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class ProjetoProfessor(Base):
    __tablename__ = "projeto_professores"

    projeto_id = Column(
        Integer,
        ForeignKey("projetos.id", ondelete="CASCADE"),
        primary_key=True
    )
    professor_id = Column(
        Integer,
        ForeignKey("professores.id", ondelete="CASCADE"),
        primary_key=True
    )
    papel_no_projeto = Column(String, nullable=False, default="orientador")

    projeto = relationship("Projeto", back_populates="professor_vinculos")
    professor = relationship("Professor", back_populates="projeto_vinculos")
