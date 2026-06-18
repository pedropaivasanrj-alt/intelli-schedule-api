from typing import Optional

from sqlalchemy.orm import Session

from app.models.acesso_log import AcessoLog
from app.models.usuario import Usuario


def registrar_log(
    db: Session,
    usuario: Optional[Usuario],
    acao: str,
    recurso: str,
    detalhes: Optional[str] = None
):
    log = AcessoLog(
        usuario_id=usuario.id if usuario else None,
        usuario_email=usuario.email if usuario else None,
        papel=usuario.papel if usuario else None,
        acao=acao,
        recurso=recurso,
        detalhes=detalhes
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log
