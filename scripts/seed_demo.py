import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

from app.core.database import SessionLocal
from app.core.security import gerar_hash_senha

from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.aluno import Aluno
from app.models.projeto import Projeto
from app.models.disponibilidade import Disponibilidade
from app.models.reuniao import Reuniao

from app.services.agendamento_service import gerar_agendamentos_automaticos


def buscar_ou_criar_usuario(db, nome, email, papel):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario:
        return usuario

    usuario = Usuario(
        nome=nome,
        email=email,
        senha_hash=gerar_hash_senha("123456"),
        papel=papel,
        ativo=True
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return usuario


def buscar_ou_criar_professor(db, nome, email, departamento, usuario_id=None):
    professor = db.query(Professor).filter(Professor.email == email).first()

    if professor:
        return professor

    professor = Professor(
        nome=nome,
        email=email,
        departamento=departamento,
        ativo=True,
        usuario_id=usuario_id
    )

    db.add(professor)
    db.commit()
    db.refresh(professor)

    return professor


def buscar_ou_criar_aluno(db, nome, email, matricula, curso, usuario_id=None):
    aluno = db.query(Aluno).filter(Aluno.email == email).first()

    if aluno:
        return aluno

    aluno = Aluno(
        nome=nome,
        email=email,
        matricula=matricula,
        curso=curso,
        ativo=True,
        usuario_id=usuario_id
    )

    db.add(aluno)
    db.commit()
    db.refresh(aluno)

    return aluno


def buscar_ou_criar_projeto(db, nome, alunos_envolvidos, descricao_foco):
    projeto = db.query(Projeto).filter(Projeto.nome == nome).first()

    if projeto:
        return projeto

    projeto = Projeto(
        nome=nome,
        alunos_envolvidos=alunos_envolvidos,
        descricao_foco=descricao_foco
    )

    db.add(projeto)
    db.commit()
    db.refresh(projeto)

    return projeto


def criar_disponibilidade(db, professor_id, data, hora_inicio, hora_fim):
    disponibilidade_existente = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.professor_id == professor_id)
        .filter(Disponibilidade.data == data)
        .filter(Disponibilidade.hora_inicio == hora_inicio)
        .filter(Disponibilidade.hora_fim == hora_fim)
        .first()
    )

    if disponibilidade_existente:
        return disponibilidade_existente

    disponibilidade = Disponibilidade(
        professor_id=professor_id,
        data=data,
        hora_inicio=hora_inicio,
        hora_fim=hora_fim
    )

    db.add(disponibilidade)
    db.commit()
    db.refresh(disponibilidade)

    return disponibilidade


def vincular_aluno_projeto(db, projeto, aluno):
    if aluno not in projeto.alunos:
        projeto.alunos.append(aluno)
        db.commit()
        db.refresh(projeto)


def limpar_reunioes_demo(db):
    projetos_demo = (
        db.query(Projeto)
        .filter(Projeto.nome.like("[DEMO]%"))
        .all()
    )

    projeto_ids = [projeto.id for projeto in projetos_demo]

    if not projeto_ids:
        return

    reunioes = (
        db.query(Reuniao)
        .filter(Reuniao.projeto_id.in_(projeto_ids))
        .all()
    )

    for reuniao in reunioes:
        db.delete(reuniao)

    db.commit()


def executar_seed():
    db = SessionLocal()

    try:
        limpar_reunioes_demo(db)

        admin = buscar_ou_criar_usuario(
            db,
            nome="Administrador Geral",
            email="admin.demo@intelli.local",
            papel="admin"
        )

        coordenador = buscar_ou_criar_usuario(
            db,
            nome="Coordenador Acadêmico",
            email="coordenador.demo@intelli.local",
            papel="coordenador"
        )

        usuario_prof_1 = buscar_ou_criar_usuario(
            db,
            nome="Usuário Prof. Ana",
            email="usuario.prof.ana@intelli.local",
            papel="professor"
        )

        usuario_prof_2 = buscar_ou_criar_usuario(
            db,
            nome="Usuário Prof. Carlos",
            email="usuario.prof.carlos@intelli.local",
            papel="professor"
        )

        prof_ana = buscar_ou_criar_professor(
            db,
            nome="Prof. Ana Martins",
            email="ana.martins@intelli.local",
            departamento="Computação",
            usuario_id=usuario_prof_1.id
        )

        prof_carlos = buscar_ou_criar_professor(
            db,
            nome="Prof. Carlos Souza",
            email="carlos.souza@intelli.local",
            departamento="Sistemas de Informação",
            usuario_id=usuario_prof_2.id
        )

        usuario_aluno_1 = buscar_ou_criar_usuario(
            db,
            nome="Usuário Maria",
            email="usuario.maria@intelli.local",
            papel="aluno"
        )

        usuario_aluno_2 = buscar_ou_criar_usuario(
            db,
            nome="Usuário Pedro",
            email="usuario.pedro@intelli.local",
            papel="aluno"
        )

        usuario_aluno_3 = buscar_ou_criar_usuario(
            db,
            nome="Usuário Lucas",
            email="usuario.lucas@intelli.local",
            papel="aluno"
        )

        maria = buscar_ou_criar_aluno(
            db,
            nome="Maria Oliveira",
            email="maria.oliveira@intelli.local",
            matricula="20260001",
            curso="Ciência da Computação",
            usuario_id=usuario_aluno_1.id
        )

        pedro = buscar_ou_criar_aluno(
            db,
            nome="Pedro Lima",
            email="pedro.lima@intelli.local",
            matricula="20260002",
            curso="Ciência da Computação",
            usuario_id=usuario_aluno_2.id
        )

        lucas = buscar_ou_criar_aluno(
            db,
            nome="Lucas Almeida",
            email="lucas.almeida@intelli.local",
            matricula="20260003",
            curso="Sistemas de Informação",
            usuario_id=usuario_aluno_3.id
        )

        projeto_1 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Sistema de Controle de Estágios",
            alunos_envolvidos="Maria Oliveira, Pedro Lima",
            descricao_foco="Avaliação da arquitetura e organização do sistema"
        )

        projeto_2 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Plataforma de Agendamento Acadêmico",
            alunos_envolvidos="Lucas Almeida",
            descricao_foco="Avaliação da API e motor de agendamento"
        )

        projeto_3 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Dashboard de Indicadores Educacionais",
            alunos_envolvidos="Maria Oliveira, Lucas Almeida",
            descricao_foco="Avaliação de dados, visualização e relatórios"
        )

        vincular_aluno_projeto(db, projeto_1, maria)
        vincular_aluno_projeto(db, projeto_1, pedro)
        vincular_aluno_projeto(db, projeto_2, lucas)
        vincular_aluno_projeto(db, projeto_3, maria)
        vincular_aluno_projeto(db, projeto_3, lucas)

        criar_disponibilidade(
            db,
            professor_id=prof_ana.id,
            data="2026-06-20",
            hora_inicio="08:00:00",
            hora_fim="12:00:00"
        )

        criar_disponibilidade(
            db,
            professor_id=prof_carlos.id,
            data="2026-06-20",
            hora_inicio="13:00:00",
            hora_fim="17:00:00"
        )

        resultado = gerar_agendamentos_automaticos(db)

        print("Seed de demonstração criado com sucesso.")
        print(f"Admin: {admin.email} | senha: 123456")
        print(f"Coordenador: {coordenador.email} | senha: 123456")
        print(f"Total agendados: {resultado['total_agendados']}")
        print(f"Total não agendados: {resultado['total_nao_agendados']}")

    finally:
        db.close()


if __name__ == "__main__":
    executar_seed()