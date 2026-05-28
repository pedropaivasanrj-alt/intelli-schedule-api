from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import io

# Nossas novas importações
from app.core.database import get_db
from app.models.professor import Professor
from app.models.projeto import Projeto
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
                alunos_envolvidos=linha.alunos_envolvidos,
                descricao_foco=linha.foco_avaliacao
            )
            db.add(novo_projeto)
            db.flush()

            # 3. Cria a intenção de Reunião (Sem horário ainda)
            nova_reuniao = Reuniao(
                projeto_id=novo_projeto.id,
                professor_id=professor.id,
                ciclo_avaliacao=linha.ciclo_avaliacao,
                # Usando datas fictícias provisórias só para o banco não reclamar por enquanto
                # Nosso algoritmo inteligente substituirá isso depois!
                data_hora_inicio="2026-01-01 00:00:00", 
                data_hora_fim="2026-01-01 00:00:00",
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