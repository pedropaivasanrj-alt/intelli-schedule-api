from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.core.database import Base

class Projeto(Base):
    __tablename__ = "projetos"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, nullable=False) 
    alunos_envolvidos = Column(String, nullable=False) # Pode ser uma string com os nomes ou e-mails
    descricao_foco = Column(String, nullable=True) # O que está sendo avaliado

    # Relacionamento: Um projeto pode ter várias reuniões ao longo dos períodos
    reunioes = relationship("Reuniao", back_populates="projeto")