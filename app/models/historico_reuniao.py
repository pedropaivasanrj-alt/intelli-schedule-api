from sqlalchemy import Column, DateTime, ForeignKey, Integer, Text, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class HistoricoReuniao(Base):
    __tablename__ = "historicos_reunioes"

    id = Column(Integer, primary_key=True, index=True)
    projeto_id = Column(
        Integer,
        ForeignKey("projetos.id", ondelete="CASCADE"),
        nullable=False
    )
    reuniao_id = Column(
        Integer,
        ForeignKey("reunioes.id", ondelete="SET NULL"),
        nullable=True
    )
    professor_id = Column(
        Integer,
        ForeignKey("professores.id", ondelete="SET NULL"),
        nullable=True
    )
    titulo = Column(String, nullable=False)
    resumo = Column(Text, nullable=False)
    decisoes = Column(Text, nullable=True)
    pendencias = Column(Text, nullable=True)
    proximos_passos = Column(Text, nullable=True)
    data_registro = Column(DateTime(timezone=True), server_default=func.now())
    atualizado_em = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    projeto = relationship("Projeto", back_populates="historicos")
    professor = relationship("Professor")
    reuniao = relationship("Reuniao")
