from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )

    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    departamento = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)

    usuario = relationship("Usuario", back_populates="professor")
    disponibilidades = relationship("Disponibilidade", back_populates="professor")
    reunioes = relationship("Reuniao", back_populates="professor")
    projeto_vinculos = relationship(
        "ProjetoProfessor",
        back_populates="professor",
        cascade="all, delete-orphan"
    )
