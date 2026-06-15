from sqlalchemy import Column, Integer, ForeignKey, Time, Date
from sqlalchemy.orm import relationship

from app.core.database import Base


class Disponibilidade(Base):
    __tablename__ = "disponibilidades"

    id = Column(Integer, primary_key=True, index=True)
    professor_id = Column(Integer, ForeignKey("professores.id", ondelete="CASCADE"), nullable=False)
    data = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fim = Column(Time, nullable=False)

    professor = relationship("Professor", back_populates="disponibilidades")