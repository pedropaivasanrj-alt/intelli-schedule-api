from sqlalchemy import Table, Column, Integer, ForeignKey

from app.core.database import Base


projeto_alunos = Table(
    "projeto_alunos",
    Base.metadata,
    Column(
        "projeto_id",
        Integer,
        ForeignKey("projetos.id", ondelete="CASCADE"),
        primary_key=True
    ),
    Column(
        "aluno_id",
        Integer,
        ForeignKey("alunos.id", ondelete="CASCADE"),
        primary_key=True
    )
)