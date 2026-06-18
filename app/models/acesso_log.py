from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func

from app.core.database import Base


class AcessoLog(Base):
    __tablename__ = "acessos_logs"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(
        Integer,
        ForeignKey("usuarios.id", ondelete="SET NULL"),
        nullable=True
    )
    usuario_email = Column(String, nullable=True)
    papel = Column(String, nullable=True)
    acao = Column(String, nullable=False)
    recurso = Column(String, nullable=False)
    detalhes = Column(Text, nullable=True)
    criado_em = Column(DateTime(timezone=True), server_default=func.now())
