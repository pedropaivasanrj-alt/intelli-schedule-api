from fastapi import FastAPI
from app.core.database import engine, Base

from app.models.professor import Professor 
from app.models.disponibilidade import Disponibilidade
from app.models.projeto import Projeto
from app.models.reuniao import Reuniao
from app.models.aluno import Aluno
from app.models.usuario import Usuario
from app.models.projeto_aluno import projeto_alunos


from app.routers import (
    upload_router,
    professores_router,
    projetos_router,
    reunioes_router,
    disponibilidades_router,
    alunos_router,
    usuarios_router,
    agendamentos_router
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IntelliSchedule API", version="1.0.0")

app.include_router(upload_router.router)
app.include_router(professores_router.router)
app.include_router(projetos_router.router)
app.include_router(reunioes_router.router)
app.include_router(disponibilidades_router.router)
app.include_router(alunos_router.router)
app.include_router(usuarios_router.router)
app.include_router(agendamentos_router.router)

@app.get("/")
def health_check():
    return {"status": "ok"}