from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship 
from app.core.database import Base

class Professor(Base):
    __tablename__ = "professores"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    departamento = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)

    # Diz ao SQLAlchemy que 1 Professor pode ter uma lista de 'Disponibilidades'
    disponibilidades = relationship("Disponibilidade", back_populates="professor")