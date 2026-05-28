from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from decouple import config # leitura do .env

# Busca a URL do banco de dados no arquivo .env
SQLALCHEMY_DATABASE_URL = config("DATABASE_URL")

# Cria o motor que vai conversar com o PostgreSQL
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Cria as sessões (cada requisição na API terá uma sessão isolada)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para criar as tabelas
Base = declarative_base()

# Dependência do FastAPI para injetar o banco nas rotas de forma segura
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()