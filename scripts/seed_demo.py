import sys
from pathlib import Path
from datetime import date, time, datetime

ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR))

from app.core.database import Base, SessionLocal, engine
from app.core.schema_migrations import aplicar_migracoes_minimas
from app.core.security import gerar_hash_senha

from app.models.usuario import Usuario
from app.models.professor import Professor
from app.models.aluno import Aluno
from app.models.projeto import Projeto
from app.models.projeto_professor import ProjetoProfessor
from app.models.historico_reuniao import HistoricoReuniao
from app.models.disponibilidade import Disponibilidade
from app.models.reuniao import Reuniao

from app.services.agendamento_service import agendar_reuniao_por_aluno


def buscar_ou_criar_usuario(db, nome, email, papel):
    usuario = db.query(Usuario).filter(Usuario.email == email).first()

    if usuario:
        usuario.nome = nome
        usuario.papel = papel
        usuario.ativo = True
        db.commit()
        db.refresh(usuario)
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
        professor.nome = nome
        professor.departamento = departamento
        professor.ativo = True
        professor.usuario_id = usuario_id
        db.commit()
        db.refresh(professor)
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
        aluno.nome = nome
        aluno.matricula = matricula
        aluno.curso = curso
        aluno.ativo = True
        aluno.usuario_id = usuario_id
        db.commit()
        db.refresh(aluno)
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


def buscar_ou_criar_projeto(
    db,
    nome,
    resumo,
    caracteristicas,
    objetivo,
    alunos_envolvidos,
    descricao_foco,
    status="Ativo"
):
    projeto = db.query(Projeto).filter(Projeto.nome == nome).first()

    if projeto:
        projeto.resumo = resumo
        projeto.caracteristicas = caracteristicas
        projeto.objetivo = objetivo
        projeto.alunos_envolvidos = alunos_envolvidos
        projeto.descricao_foco = descricao_foco
        projeto.status = status
        db.commit()
        db.refresh(projeto)
        return projeto

    projeto = Projeto(
        nome=nome,
        resumo=resumo,
        caracteristicas=caracteristicas,
        objetivo=objetivo,
        alunos_envolvidos=alunos_envolvidos,
        descricao_foco=descricao_foco,
        status=status
    )

    db.add(projeto)
    db.commit()
    db.refresh(projeto)

    return projeto


def vincular_professor_projeto(
    db,
    projeto,
    professor,
    papel_no_projeto="orientador"
):
    vinculo = (
        db.query(ProjetoProfessor)
        .filter(ProjetoProfessor.projeto_id == projeto.id)
        .filter(ProjetoProfessor.professor_id == professor.id)
        .first()
    )

    if vinculo:
        vinculo.papel_no_projeto = papel_no_projeto
    else:
        vinculo = ProjetoProfessor(
            projeto_id=projeto.id,
            professor_id=professor.id,
            papel_no_projeto=papel_no_projeto
        )
        db.add(vinculo)

    db.commit()
    db.refresh(projeto)

    return vinculo


def garantir_orientador_em_projetos_sem_vinculo(db, professor_padrao):
    projetos = db.query(Projeto).all()

    for projeto in projetos:
        orientador = (
            db.query(ProjetoProfessor)
            .filter(ProjetoProfessor.projeto_id == projeto.id)
            .filter(ProjetoProfessor.papel_no_projeto == "orientador")
            .first()
        )

        if orientador:
            continue

        vincular_professor_projeto(
            db,
            projeto=projeto,
            professor=professor_padrao,
            papel_no_projeto="orientador"
        )


def criar_disponibilidade(db, professor_id, data, hora_inicio, hora_fim):
    disponibilidade = (
        db.query(Disponibilidade)
        .filter(Disponibilidade.professor_id == professor_id)
        .filter(Disponibilidade.data == data)
        .filter(Disponibilidade.hora_inicio == hora_inicio)
        .filter(Disponibilidade.hora_fim == hora_fim)
        .first()
    )

    if disponibilidade:
        return disponibilidade

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


def agendar_demo_se_nao_existir(
    db,
    aluno_id,
    projeto_id,
    professor_id,
    data_hora_inicio
):
    reuniao_existente = (
        db.query(Reuniao)
        .filter(Reuniao.projeto_id == projeto_id)
        .first()
    )

    if reuniao_existente:
        return None

    return agendar_reuniao_por_aluno(
        db=db,
        aluno_id=aluno_id,
        projeto_id=projeto_id,
        professor_id=professor_id,
        data_hora_inicio=data_hora_inicio
    )


def executar_seed():
    Base.metadata.create_all(bind=engine)
    aplicar_migracoes_minimas(engine)

    db = SessionLocal()

    try:
        limpar_reunioes_demo(db)

        admin = buscar_ou_criar_usuario(
            db,
            nome="Administrador Geral",
            email="admin.demo@intelli.com.br",
            papel="admin"
        )

        coordenador = buscar_ou_criar_usuario(
            db,
            nome="Coordenador Acadêmico",
            email="coordenador.demo@intelli.com.br",
            papel="coordenador"
        )

        usuario_prof_ana = buscar_ou_criar_usuario(
            db,
            nome="Prof. Ana Martins",
            email="ana.martins@intelli.com.br",
            papel="professor"
        )

        usuario_prof_carlos = buscar_ou_criar_usuario(
            db,
            nome="Prof. Carlos Souza",
            email="carlos.souza@intelli.com.br",
            papel="professor"
        )

        prof_ana = buscar_ou_criar_professor(
            db,
            nome="Prof. Ana Martins",
            email="ana.martins@intelli.com.br",
            departamento="Computação",
            usuario_id=usuario_prof_ana.id
        )

        prof_carlos = buscar_ou_criar_professor(
            db,
            nome="Prof. Carlos Souza",
            email="carlos.souza@intelli.com.br",
            departamento="Sistemas de Informação",
            usuario_id=usuario_prof_carlos.id
        )

        garantir_orientador_em_projetos_sem_vinculo(db, prof_ana)

        usuario_maria = buscar_ou_criar_usuario(
            db,
            nome="Maria Oliveira",
            email="maria.oliveira@intelli.com.br",
            papel="aluno"
        )

        usuario_pedro = buscar_ou_criar_usuario(
            db,
            nome="Pedro Lima",
            email="pedro.lima@intelli.com.br",
            papel="aluno"
        )

        usuario_lucas = buscar_ou_criar_usuario(
            db,
            nome="Lucas Almeida",
            email="lucas.almeida@intelli.com.br",
            papel="aluno"
        )

        maria = buscar_ou_criar_aluno(
            db,
            nome="Maria Oliveira",
            email="maria.oliveira@intelli.com.br",
            matricula="20260001",
            curso="Ciência da Computação",
            usuario_id=usuario_maria.id
        )

        pedro = buscar_ou_criar_aluno(
            db,
            nome="Pedro Lima",
            email="pedro.lima@intelli.com.br",
            matricula="20260002",
            curso="Ciência da Computação",
            usuario_id=usuario_pedro.id
        )

        lucas = buscar_ou_criar_aluno(
            db,
            nome="Lucas Almeida",
            email="lucas.almeida@intelli.com.br",
            matricula="20260003",
            curso="Sistemas de Informação",
            usuario_id=usuario_lucas.id
        )

        projeto_1 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Sistema de Controle de Estágios",
            resumo="Sistema para controlar estágios, orientações e entregas acadêmicas.",
            caracteristicas="Cadastro de estágios, acompanhamento por professor, agenda de checkpoints e indicadores.",
            objetivo="Organizar o acompanhamento acadêmico dos estágios com rastreabilidade.",
            alunos_envolvidos="Maria Oliveira, Pedro Lima",
            descricao_foco="Avaliação da arquitetura e organização do sistema"
        )

        projeto_2 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Plataforma de Agendamento Acadêmico",
            resumo="Plataforma para agendar reuniões entre alunos, professores e coordenação.",
            caracteristicas="Disponibilidades por professor, agendamento por aluno, prevenção de conflitos e agenda consolidada.",
            objetivo="Reduzir o trabalho manual da coordenação no processo de agendamento.",
            alunos_envolvidos="Lucas Almeida",
            descricao_foco="Avaliação da API e motor de agendamento"
        )

        projeto_3 = buscar_ou_criar_projeto(
            db,
            nome="[DEMO] Dashboard de Indicadores Educacionais",
            resumo="Dashboard para acompanhar projetos, reuniões e pendências acadêmicas.",
            caracteristicas="Indicadores gerenciais, cards por projeto, histórico de reuniões e status acadêmico.",
            objetivo="Dar visibilidade executiva ao andamento dos projetos acadêmicos.",
            alunos_envolvidos="Maria Oliveira, Lucas Almeida",
            descricao_foco="Avaliação de dados, visualização e relatórios"
        )

        vincular_professor_projeto(db, projeto_1, prof_ana, "orientador")
        vincular_professor_projeto(db, projeto_1, prof_carlos, "avaliador")
        vincular_professor_projeto(db, projeto_2, prof_ana, "orientador")
        vincular_professor_projeto(db, projeto_3, prof_carlos, "orientador")

        vincular_aluno_projeto(db, projeto_1, maria)
        vincular_aluno_projeto(db, projeto_1, pedro)
        vincular_aluno_projeto(db, projeto_2, lucas)
        vincular_aluno_projeto(db, projeto_3, maria)
        vincular_aluno_projeto(db, projeto_3, lucas)

        criar_disponibilidade(
            db,
            professor_id=prof_ana.id,
            data=date(2026, 6, 21),
            hora_inicio=time(8, 0),
            hora_fim=time(12, 0)
        )

        criar_disponibilidade(
            db,
            professor_id=prof_carlos.id,
            data=date(2026, 6, 21),
            hora_inicio=time(13, 0),
            hora_fim=time(17, 0)
        )

        agendamento_1 = agendar_demo_se_nao_existir(
            db,
            aluno_id=maria.id,
            projeto_id=projeto_1.id,
            professor_id=prof_ana.id,
            data_hora_inicio=datetime(2026, 6, 21, 8, 0)
        )

        agendamento_2 = agendar_demo_se_nao_existir(
            db,
            aluno_id=lucas.id,
            projeto_id=projeto_2.id,
            professor_id=prof_ana.id,
            data_hora_inicio=datetime(2026, 6, 21, 9, 0)
        )

        agendamento_3 = agendar_demo_se_nao_existir(
            db,
            aluno_id=maria.id,
            projeto_id=projeto_3.id,
            professor_id=prof_carlos.id,
            data_hora_inicio=datetime(2026, 6, 21, 13, 0)
        )

        agendamentos_criados = [
            agendamento
            for agendamento in [agendamento_1, agendamento_2, agendamento_3]
            if agendamento is not None
        ]

        print("Seed de demonstração criado com sucesso.")
        print("")
        print("Acessos demonstrativos:")
        print(f"Admin: {admin.email} | senha: 123456")
        print(f"Coordenador: {coordenador.email} | senha: 123456")
        print(f"Professor Ana: {prof_ana.email} | senha: 123456")
        print(f"Aluno Maria: {maria.email} | senha: 123456")
        print(f"Aluno Lucas: {lucas.email} | senha: 123456")
        print("")
        print(f"Professores criados: {prof_ana.nome}, {prof_carlos.nome}")
        print(
            "Projetos demo criados: "
            f"{projeto_1.nome}, {projeto_2.nome}, {projeto_3.nome}"
        )
        print(
            "Agendamentos criados pelo fluxo do aluno: "
            f"{len(agendamentos_criados)}"
        )

    finally:
        db.close()


if __name__ == "__main__":
    executar_seed()
