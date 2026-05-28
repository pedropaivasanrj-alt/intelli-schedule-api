from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Disponibilidade(Base):
    __tablename__ = "disponibilidades"

    id = Column(Integer, primary_key=True, index=True)
    
    # Chave Estrangeira: Liga esta disponibilidade a um professor específico
    # ondelete="CASCADE" garante que, se o professor for apagado, os seus horários também serão
    professor_id = Column(Integer, ForeignKey("professores.id", ondelete="CASCADE"), nullable=False)
    
    dia_semana = Column(String, nullable=False) # Ex: "Segunda-feira"
    hora_inicio = Column(String, nullable=False) # Ex: "08:00"
    hora_fim = Column(String, nullable=False) # Ex: "10:00"

    # Relacionamento que permite ao Python navegar para o Professor associado
    professor = relationship("Professor", back_populates="disponibilidades")