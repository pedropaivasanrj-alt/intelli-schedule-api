from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import pandas as pd
import io

# Nossas novas importações
from app.core.database import get_db
from app.models.professor import Professor
from app.models.projeto import Projeto
from app.models.projeto_professor import ProjetoProfessor
from app.models.reuniao import Reuniao
from app.schemas.upload_schema import LoteProjetos

router = APIRouter(prefix="/api/v1/upload", tags=["Ingestão de Dados"])

# ... (MANTENHA A SUA ROTA DE PREVIEW AQUI INTACTA) ...

@router.post("/salvar-projetos")
def salvar_planilha_projetos(lote: LoteProjetos, db: Session = Depends(get_db)):
    """
    Recebe o JSON validado pelo frontend (após o preview) e salva de forma inteligente no banco.
    """
    projetos_salvos = 0

    try:
        for linha in lote.projetos:
            # 1. Inteligência: Verifica se o Professor já existe pelo e-mail
            professor = db.query(Professor).filter(Professor.email == linha.email_avaliador).first()
            
            # Se não existe, cria um professor "Fantasma/Temporário" para ele acessar depois
            if not professor:
                professor = Professor(
                    nome=linha.email_avaliador.split("@")[0], # Pega o nome antes do @
                    email=linha.email_avaliador,
                    ativo=True
                )
                db.add(professor)
                db.flush() # Atualiza o ID do professor no banco sem commitar tudo ainda

            # 2. Cria o Projeto
            novo_projeto = Projeto(
                nome=linha.nome_projeto,
                resumo=f"Projeto importado para avaliação: {linha.nome_projeto}",
                caracteristicas=linha.foco_avaliacao,
                objetivo="Organizar a avaliação acadêmica do projeto importado.",
                alunos_envolvidos=linha.alunos_envolvidos,
                descricao_foco=linha.foco_avaliacao,
                status="Ativo"
            )
            db.add(novo_projeto)
            db.flush()

            db.add(
                ProjetoProfessor(
                    projeto_id=novo_projeto.id,
                    professor_id=professor.id,
                    papel_no_projeto="orientador"
                )
            )

            # 3. Cria a intenção de reunião com horário provisório válido.
            data_hora_provisoria = datetime(2026, 1, 1, 0, 0, 0)
            nova_reuniao = Reuniao(
                projeto_id=novo_projeto.id,
                professor_id=professor.id,
                ciclo_avaliacao=linha.ciclo_avaliacao,
                data_hora_inicio=data_hora_provisoria,
                data_hora_fim=data_hora_provisoria + timedelta(hours=1),
                status="Pendente de Agendamento"
            )
            db.add(nova_reuniao)
            projetos_salvos += 1

        # Salva tudo de uma vez (Transação Segura)
        db.commit()
        
        return {"mensagem": f"Sucesso! {projetos_salvos} projetos e reuniões foram cadastrados e vinculados."}

    except Exception as e:
        db.rollback() # Se der qualquer erro no meio do caminho, desfaz TUDO para não corromper o banco
        raise HTTPException(status_code=500, detail=f"Erro ao salvar no banco: {str(e)}")
