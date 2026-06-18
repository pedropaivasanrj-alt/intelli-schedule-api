from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.database import Base, engine
from app.core.schema_migrations import aplicar_migracoes_minimas

from app.models.acesso_log import AcessoLog
from app.models.aluno import Aluno
from app.models.disponibilidade import Disponibilidade
from app.models.historico_reuniao import HistoricoReuniao
from app.models.professor import Professor
from app.models.projeto import Projeto
from app.models.projeto_aluno import projeto_alunos
from app.models.projeto_professor import ProjetoProfessor
from app.models.reuniao import Reuniao
from app.models.usuario import Usuario

from app.routers import (
    agendamentos_router,
    alunos_router,
    auth_router,
    dashboard_router,
    disponibilidades_router,
    professores_router,
    projetos_router,
    reunioes_router,
    upload_router,
    usuarios_router,
)

Base.metadata.create_all(bind=engine)
aplicar_migracoes_minimas(engine)

app = FastAPI(title="IntelliSchedule API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router.router)
app.include_router(professores_router.router)
app.include_router(projetos_router.router)
app.include_router(reunioes_router.router)
app.include_router(disponibilidades_router.router)
app.include_router(alunos_router.router)
app.include_router(usuarios_router.router)
app.include_router(agendamentos_router.router)
app.include_router(auth_router.router)
app.include_router(dashboard_router.router)

STATIC_DIR = Path(__file__).resolve().parent / "static"
if STATIC_DIR.exists():
    app.mount(
        "/app",
        StaticFiles(directory=STATIC_DIR, html=True),
        name="intellischedule_app"
    )


@app.get("/")
def health_check():
    return {
        "status": "ok",
        "app": "/app"
    }
