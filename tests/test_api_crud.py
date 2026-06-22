from datetime import date
from uuid import uuid4

from fastapi.testclient import TestClient

from app.core.database import SessionLocal
from app.core.security import gerar_hash_senha
from app.main import app
from app.models.periodo_agendamento import PeriodoAgendamento
from app.models.usuario import Usuario

client = TestClient(app)


def projeto_payload(
    nome: str,
    orientador_id: int,
    alunos_envolvidos: str = "Aluno Teste",
    descricao_foco: str = "Teste automatizado"
):
    return {
        "nome": nome,
        "resumo": f"Resumo do {nome}",
        "caracteristicas": f"Características do {nome}",
        "objetivo": f"Objetivo do {nome}",
        "alunos_envolvidos": alunos_envolvidos,
        "descricao_foco": descricao_foco,
        "status": "Ativo",
        "orientador_id": orientador_id
    }


def criar_periodo_agendamento_para_teste(
    data_inicio: date = date(2026, 6, 1),
    data_fim: date = date(2026, 6, 30)
):
    db = SessionLocal()

    try:
        periodos_ativos = (
            db.query(PeriodoAgendamento)
            .filter(PeriodoAgendamento.ativo == True)
            .all()
        )

        for periodo in periodos_ativos:
            periodo.ativo = False

        coordenador = Usuario(
            nome="Coordenador Período Teste",
            email=f"coord_periodo_{uuid4().hex[:8]}@teste.com",
            senha_hash=gerar_hash_senha("123456"),
            papel="coordenador",
            ativo=True
        )

        db.add(coordenador)
        db.commit()
        db.refresh(coordenador)

        periodo = PeriodoAgendamento(
            titulo=f"Período Teste {uuid4().hex[:8]}",
            descricao="Período aberto para teste de agendamento.",
            data_inicio=data_inicio,
            data_fim=data_fim,
            ativo=True,
            criado_por_id=coordenador.id
        )

        db.add(periodo)
        db.commit()
        db.refresh(periodo)

        return periodo.id

    finally:
        db.close()


def test_health_check():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_fluxo_crud_principal():
    email_teste = f"professor_{uuid4().hex[:8]}@teste.com"

    # 1. Criar professor
    professor_payload = {
        "nome": "Professor Teste",
        "email": email_teste,
        "departamento": "Computação",
        "ativo": True
    }

    response_professor = client.post(
        "/api/v1/professores/",
        json=professor_payload
    )

    assert response_professor.status_code == 200
    professor = response_professor.json()
    assert professor["nome"] == professor_payload["nome"]
    assert professor["email"] == professor_payload["email"]

    professor_id = professor["id"]

    # 2. Buscar professor por ID
    response_busca_professor = client.get(
        f"/api/v1/professores/{professor_id}"
    )

    assert response_busca_professor.status_code == 200
    assert response_busca_professor.json()["id"] == professor_id

    # 3. Criar projeto
    projeto_payload_teste = projeto_payload(
        nome="Projeto Teste API",
        orientador_id=professor_id,
        alunos_envolvidos="Aluno Teste 1, Aluno Teste 2",
        descricao_foco="Teste automatizado do fluxo principal"
    )

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload_teste
    )

    assert response_projeto.status_code == 200
    projeto = response_projeto.json()
    assert projeto["nome"] == projeto_payload_teste["nome"]
    assert projeto["resumo"] == projeto_payload_teste["resumo"]
    assert projeto["caracteristicas"] == projeto_payload_teste["caracteristicas"]
    assert any(
        professor["papel_no_projeto"] == "orientador"
        for professor in projeto["professores"]
    )

    projeto_id = projeto["id"]

    # 4. Buscar projeto por ID
    response_busca_projeto = client.get(
        f"/api/v1/projetos/{projeto_id}"
    )

    assert response_busca_projeto.status_code == 200
    assert response_busca_projeto.json()["id"] == projeto_id

    # 5. Criar disponibilidade
    disponibilidade_payload = {
        "professor_id": professor_id,
        "data": "2026-06-16",
        "hora_inicio": "08:00:00",
        "hora_fim": "10:00:00"
    }

    response_disponibilidade = client.post(
        "/api/v1/disponibilidades/",
        json=disponibilidade_payload
    )

    assert response_disponibilidade.status_code == 200
    disponibilidade = response_disponibilidade.json()
    assert disponibilidade["professor_id"] == professor_id

    disponibilidade_id = disponibilidade["id"]

    # 6. Buscar disponibilidade por ID
    response_busca_disponibilidade = client.get(
        f"/api/v1/disponibilidades/{disponibilidade_id}"
    )

    assert response_busca_disponibilidade.status_code == 200
    assert response_busca_disponibilidade.json()["id"] == disponibilidade_id

    # 7. Criar reunião
    reuniao_payload = {
        "projeto_id": projeto_id,
        "professor_id": professor_id,
        "ciclo_avaliacao": "Checkpoint Teste",
        "data_hora_inicio": "2026-06-16T08:00:00",
        "data_hora_fim": "2026-06-16T09:00:00",
        "status": "Agendado"
    }

    response_reuniao = client.post(
        "/api/v1/reunioes/",
        json=reuniao_payload
    )

    assert response_reuniao.status_code == 200
    reuniao = response_reuniao.json()
    assert reuniao["projeto_id"] == projeto_id
    assert reuniao["professor_id"] == professor_id
    assert reuniao["status"] == "Agendado"

    reuniao_id = reuniao["id"]

    # 8. Buscar reunião por ID
    response_busca_reuniao = client.get(
        f"/api/v1/reunioes/{reuniao_id}"
    )

    assert response_busca_reuniao.status_code == 200
    assert response_busca_reuniao.json()["id"] == reuniao_id

    # 9. Atualizar status da reunião
    response_status = client.patch(
        f"/api/v1/reunioes/{reuniao_id}/status",
        json={"status": "Concluído"}
    )

    assert response_status.status_code == 200
    assert response_status.json()["status"] == "Concluído"

    # 10. Listar todos
    assert client.get("/api/v1/professores/").status_code == 200
    assert client.get("/api/v1/projetos/").status_code == 200
    assert client.get("/api/v1/disponibilidades/").status_code == 200
    assert client.get("/api/v1/reunioes/").status_code == 200

    # 11. Deletar na ordem segura
    response_delete_reuniao = client.delete(
        f"/api/v1/reunioes/{reuniao_id}"
    )
    assert response_delete_reuniao.status_code == 200

    response_delete_disponibilidade = client.delete(
        f"/api/v1/disponibilidades/{disponibilidade_id}"
    )
    assert response_delete_disponibilidade.status_code == 200

    response_delete_projeto = client.delete(
        f"/api/v1/projetos/{projeto_id}"
    )
    assert response_delete_projeto.status_code == 200

    response_delete_professor = client.delete(
        f"/api/v1/professores/{professor_id}"
    )
    assert response_delete_professor.status_code == 200


def test_nao_deve_criar_professor_com_email_repetido():
    email_teste = f"duplicado_{uuid4().hex[:8]}@teste.com"

    payload = {
        "nome": "Professor Duplicado",
        "email": email_teste,
        "departamento": "Computação",
        "ativo": True
    }

    primeira_resposta = client.post("/api/v1/professores/", json=payload)
    assert primeira_resposta.status_code == 200

    segunda_resposta = client.post("/api/v1/professores/", json=payload)
    assert segunda_resposta.status_code == 400

    professor_id = primeira_resposta.json()["id"]

    client.delete(f"/api/v1/professores/{professor_id}")


def test_nao_deve_criar_reuniao_com_horario_invalido():
    email_teste = f"horario_{uuid4().hex[:8]}@teste.com"

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Horário",
            "email": email_teste,
            "departamento": "Computação",
            "ativo": True
        }
    )

    professor_id = response_professor.json()["id"]

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto Horário Inválido",
            orientador_id=professor_id,
            alunos_envolvidos="Aluno Teste",
            descricao_foco="Teste de horário inválido"
        )
    )

    projeto_id = response_projeto.json()["id"]

    response_reuniao = client.post(
        "/api/v1/reunioes/",
        json={
            "projeto_id": projeto_id,
            "professor_id": professor_id,
            "ciclo_avaliacao": "Checkpoint Inválido",
            "data_hora_inicio": "2026-06-16T10:00:00",
            "data_hora_fim": "2026-06-16T09:00:00",
            "status": "Agendado"
        }
    )

    assert response_reuniao.status_code == 400

    client.delete(f"/api/v1/projetos/{projeto_id}")
    client.delete(f"/api/v1/professores/{professor_id}")


def test_upload_salvar_projetos():
    email_teste = f"avaliador_{uuid4().hex[:8]}@teste.com"

    payload = {
        "projetos": [
            {
                "nome_projeto": "Projeto via Upload Teste",
                "alunos_envolvidos": "Aluno Upload 1, Aluno Upload 2",
                "foco_avaliacao": "Validação da rota de upload",
                "ciclo_avaliacao": "Checkpoint Upload",
                "email_avaliador": email_teste
            }
        ]
    }

    response = client.post(
        "/api/v1/upload/salvar-projetos",
        json=payload
    )

    assert response.status_code == 200
    assert "Sucesso" in response.json()["mensagem"]
def test_crud_alunos():
    email_teste = f"aluno_{uuid4().hex[:8]}@teste.com"
    matricula_teste = f"MAT-{uuid4().hex[:8]}"

    payload = {
        "nome": "Aluno Teste",
        "email": email_teste,
        "matricula": matricula_teste,
        "curso": "Ciência da Computação",
        "ativo": True
    }

    response_create = client.post(
        "/api/v1/alunos/",
        json=payload
    )

    assert response_create.status_code == 200

    aluno = response_create.json()

    assert aluno["nome"] == payload["nome"]
    assert aluno["email"] == payload["email"]
    assert aluno["matricula"] == payload["matricula"]
    assert aluno["curso"] == payload["curso"]

    aluno_id = aluno["id"]

    response_get = client.get(f"/api/v1/alunos/{aluno_id}")

    assert response_get.status_code == 200
    assert response_get.json()["id"] == aluno_id

    response_list = client.get("/api/v1/alunos/")

    assert response_list.status_code == 200

    response_delete = client.delete(f"/api/v1/alunos/{aluno_id}")

    assert response_delete.status_code == 200
def test_crud_usuarios_e_admin_unico():
    email_admin = f"admin_{uuid4().hex[:8]}@teste.com"
    email_coord = f"coord_{uuid4().hex[:8]}@teste.com"

    admin_payload = {
        "nome": "Administrador Teste",
        "email": email_admin,
        "senha": "123456",
        "papel": "admin",
        "ativo": True
    }

    response_admin = client.post(
        "/api/v1/usuarios/",
        json=admin_payload
    )

    assert response_admin.status_code == 200

    admin = response_admin.json()
    assert admin["email"] == email_admin
    assert admin["papel"] == "admin"
    assert "senha" not in admin
    assert "senha_hash" not in admin

    admin_id = admin["id"]

    segundo_admin_payload = {
        "nome": "Segundo Admin",
        "email": f"segundo_admin_{uuid4().hex[:8]}@teste.com",
        "senha": "123456",
        "papel": "admin",
        "ativo": True
    }

    response_segundo_admin = client.post(
        "/api/v1/usuarios/",
        json=segundo_admin_payload
    )

    assert response_segundo_admin.status_code == 400

    coordenador_payload = {
        "nome": "Coordenador Teste",
        "email": email_coord,
        "senha": "123456",
        "papel": "coordenador",
        "ativo": True
    }

    response_coord = client.post(
        "/api/v1/usuarios/",
        json=coordenador_payload
    )

    assert response_coord.status_code == 200

    coordenador = response_coord.json()
    assert coordenador["papel"] == "coordenador"

    coordenador_id = coordenador["id"]

    response_list = client.get("/api/v1/usuarios/")
    assert response_list.status_code == 200

    response_get = client.get(f"/api/v1/usuarios/{admin_id}")
    assert response_get.status_code == 200

    response_delete_coord = client.delete(f"/api/v1/usuarios/{coordenador_id}")
    assert response_delete_coord.status_code == 200

    response_delete_admin = client.delete(f"/api/v1/usuarios/{admin_id}")
    assert response_delete_admin.status_code == 200

def test_vincular_aluno_a_projeto():
    email_aluno = f"aluno_projeto_{uuid4().hex[:8]}@teste.com"
    email_professor = f"prof_projeto_{uuid4().hex[:8]}@teste.com"
    matricula = f"MAT-PROJ-{uuid4().hex[:8]}"

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Projeto Teste",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    response_aluno = client.post(
        "/api/v1/alunos/",
        json={
            "nome": "Aluno Projeto Teste",
            "email": email_aluno,
            "matricula": matricula,
            "curso": "Ciência da Computação",
            "ativo": True
        }
    )

    assert response_aluno.status_code == 200
    aluno_id = response_aluno.json()["id"]

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto com Aluno Vinculado",
            orientador_id=professor_id,
            alunos_envolvidos="Aluno Projeto Teste",
            descricao_foco="Teste de vínculo real entre aluno e projeto"
        )
    )

    assert response_projeto.status_code == 200
    projeto_id = response_projeto.json()["id"]

    response_vinculo = client.post(
        f"/api/v1/projetos/{projeto_id}/alunos/{aluno_id}"
    )

    assert response_vinculo.status_code == 200

    response_lista = client.get(
        f"/api/v1/projetos/{projeto_id}/alunos"
    )

    assert response_lista.status_code == 200
    alunos = response_lista.json()

    assert len(alunos) >= 1
    assert alunos[0]["id"] == aluno_id

    response_remover = client.delete(
        f"/api/v1/projetos/{projeto_id}/alunos/{aluno_id}"
    )

    assert response_remover.status_code == 200

    client.delete(f"/api/v1/projetos/{projeto_id}")
    client.delete(f"/api/v1/alunos/{aluno_id}")
    client.delete(f"/api/v1/professores/{professor_id}")
def test_gerar_agendamento_automatico():
    email_professor = f"prof_agendamento_{uuid4().hex[:8]}@teste.com"

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Agendamento",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    criar_periodo_agendamento_para_teste(
        data_inicio=date(2026, 6, 1),
        data_fim=date(2026, 6, 30)
    )

    response_disponibilidade = client.post(
        "/api/v1/disponibilidades/",
        json={
            "professor_id": professor_id,
            "data": "2026-06-20",
            "hora_inicio": "08:00:00",
            "hora_fim": "18:00:00"
        }
    )

    assert response_disponibilidade.status_code == 200
    disponibilidade_id = response_disponibilidade.json()["id"]

    response_projeto_1 = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto Agendamento 1",
            orientador_id=professor_id,
            alunos_envolvidos="Aluno A",
            descricao_foco="Teste de agendamento automático"
        )
    )

    response_projeto_2 = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto Agendamento 2",
            orientador_id=professor_id,
            alunos_envolvidos="Aluno B",
            descricao_foco="Teste de agendamento automático"
        )
    )

    assert response_projeto_1.status_code == 200
    assert response_projeto_2.status_code == 200

    projeto_1_id = response_projeto_1.json()["id"]
    projeto_2_id = response_projeto_2.json()["id"]

    response_agendamento = client.post("/api/v1/agendamentos/gerar")

    assert response_agendamento.status_code == 200

    resultado = response_agendamento.json()

    agendados_teste = [
        item for item in resultado["agendados"]
        if item["projeto_id"] in [projeto_1_id, projeto_2_id]
    ]

    assert len(agendados_teste) == 2

    reuniao_ids = [item["reuniao_id"] for item in agendados_teste]

    for reuniao_id in reuniao_ids:
        client.delete(f"/api/v1/reunioes/{reuniao_id}")

    client.delete(f"/api/v1/disponibilidades/{disponibilidade_id}")
    client.delete(f"/api/v1/projetos/{projeto_1_id}")
    client.delete(f"/api/v1/projetos/{projeto_2_id}")
    client.delete(f"/api/v1/professores/{professor_id}")
    
def test_visualizar_agenda_completa():
    response = client.get("/api/v1/agendamentos/agenda")

    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_aluno_realiza_agendamento():
    email_professor = f"prof_aluno_agenda_{uuid4().hex[:8]}@teste.com"
    email_aluno = f"aluno_agenda_{uuid4().hex[:8]}@teste.com"
    matricula = f"MAT-AGENDA-{uuid4().hex[:8]}"

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Agendamento Aluno",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    response_aluno = client.post(
        "/api/v1/alunos/",
        json={
            "nome": "Aluno que Agenda",
            "email": email_aluno,
            "matricula": matricula,
            "curso": "Ciência da Computação",
            "ativo": True
        }
    )

    assert response_aluno.status_code == 200
    aluno_id = response_aluno.json()["id"]

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto Agendado pelo Aluno",
            orientador_id=professor_id,
            alunos_envolvidos="Aluno que Agenda",
            descricao_foco="Teste do fluxo de agendamento feito pelo aluno"
        )
    )
    
    assert response_projeto.status_code == 200
    projeto_id = response_projeto.json()["id"]

    response_vinculo = client.post(
        f"/api/v1/projetos/{projeto_id}/alunos/{aluno_id}"
    )

    assert response_vinculo.status_code == 200

    criar_periodo_agendamento_para_teste(
        data_inicio=date(2026, 6, 1),
        data_fim=date(2026, 6, 30)
    )

    response_disponibilidade = client.post(
        "/api/v1/disponibilidades/",
        json={
            "professor_id": professor_id,
            "data": "2026-06-21",
            "hora_inicio": "08:00:00",
            "hora_fim": "12:00:00"
        }
    )

    assert response_disponibilidade.status_code == 200
    disponibilidade_id = response_disponibilidade.json()["id"]

    response_horarios = client.get(
        f"/api/v1/agendamentos/horarios-disponiveis?data=2026-06-21&professor_id={professor_id}"
    )

    assert response_horarios.status_code == 200
    assert len(response_horarios.json()) >= 1

    response_agendamento = client.post(
        "/api/v1/agendamentos/aluno/agendar",
        json={
            "aluno_id": aluno_id,
            "projeto_id": projeto_id,
            "professor_id": professor_id,
            "data_hora_inicio": "2026-06-21T08:00:00"
        }
    )

    assert response_agendamento.status_code == 200

    agendamento = response_agendamento.json()

    assert agendamento["aluno_id"] == aluno_id
    assert agendamento["projeto_id"] == projeto_id
    assert agendamento["professor_id"] == professor_id
    assert agendamento["status"] == "Agendado"

    reuniao_id = agendamento["reuniao_id"]

    response_conflito = client.post(
        "/api/v1/agendamentos/aluno/agendar",
        json={
            "aluno_id": aluno_id,
            "projeto_id": projeto_id,
            "professor_id": professor_id,
            "data_hora_inicio": "2026-06-21T08:00:00"
        }
    )

    assert response_conflito.status_code == 400

    client.delete(f"/api/v1/reunioes/{reuniao_id}")
    client.delete(f"/api/v1/disponibilidades/{disponibilidade_id}")
    client.delete(f"/api/v1/projetos/{projeto_id}")
    client.delete(f"/api/v1/alunos/{aluno_id}")
    client.delete(f"/api/v1/professores/{professor_id}")

def test_login_e_obter_usuario_atual():
    email_usuario = f"login_{uuid4().hex[:8]}@teste.com"

    response_usuario = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Usuário Login",
            "email": email_usuario,
            "senha": "123456",
            "papel": "coordenador",
            "ativo": True
        }
    )

    assert response_usuario.status_code == 200
    usuario_id = response_usuario.json()["id"]

    response_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_usuario,
            "senha": "123456"
        }
    )

    assert response_login.status_code == 200

    dados_login = response_login.json()

    assert "access_token" in dados_login
    assert dados_login["token_type"] == "bearer"
    assert dados_login["usuario"]["email"] == email_usuario
    assert dados_login["usuario"]["papel"] == "coordenador"

    token = dados_login["access_token"]

    response_me = client.get(
        "/api/v1/auth/me",
        headers={
            "Authorization": f"Bearer {token}"
        }
    )

    assert response_me.status_code == 200
    assert response_me.json()["email"] == email_usuario

    client.delete(f"/api/v1/usuarios/{usuario_id}")


def test_dashboard_restrito_por_papel():
    email_coord = f"coord_dashboard_{uuid4().hex[:8]}@teste.com"
    email_aluno = f"aluno_dashboard_{uuid4().hex[:8]}@teste.com"

    response_coord = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Coordenador Dashboard",
            "email": email_coord,
            "senha": "123456",
            "papel": "coordenador",
            "ativo": True
        }
    )

    assert response_coord.status_code == 200
    coord_id = response_coord.json()["id"]

    response_aluno = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Aluno Dashboard",
            "email": email_aluno,
            "senha": "123456",
            "papel": "aluno",
            "ativo": True
        }
    )

    assert response_aluno.status_code == 200
    aluno_usuario_id = response_aluno.json()["id"]

    response_login_coord = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_coord,
            "senha": "123456"
        }
    )

    assert response_login_coord.status_code == 200
    token_coord = response_login_coord.json()["access_token"]

    response_dashboard_coord = client.get(
        "/api/v1/dashboard/resumo",
        headers={
            "Authorization": f"Bearer {token_coord}"
        }
    )

    assert response_dashboard_coord.status_code == 200

    indicadores = response_dashboard_coord.json()["indicadores"]

    assert "professores" in indicadores
    assert "alunos" in indicadores
    assert "projetos" in indicadores
    assert "reunioes_agendadas" in indicadores
    assert "projetos_sem_agendamento" in indicadores
    assert "conflitos_evitados" not in indicadores

    response_login_aluno = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_aluno,
            "senha": "123456"
        }
    )

    assert response_login_aluno.status_code == 200
    token_aluno = response_login_aluno.json()["access_token"]

    response_dashboard_aluno = client.get(
        "/api/v1/dashboard/resumo",
        headers={
            "Authorization": f"Bearer {token_aluno}"
        }
    )

    assert response_dashboard_aluno.status_code == 403

    client.delete(f"/api/v1/usuarios/{coord_id}")
    client.delete(f"/api/v1/usuarios/{aluno_usuario_id}")


def test_admin_gerencia_coordenadores_e_logs():
    email_admin = f"admin_acesso_{uuid4().hex[:8]}@teste.com"
    email_coord = f"coord_acesso_{uuid4().hex[:8]}@teste.com"

    response_admin = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Admin Acessos",
            "email": email_admin,
            "senha": "123456",
            "papel": "admin",
            "ativo": True
        }
    )

    assert response_admin.status_code == 200
    admin_id = response_admin.json()["id"]

    response_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_admin,
            "senha": "123456"
        }
    )

    assert response_login.status_code == 200
    headers = {
        "Authorization": f"Bearer {response_login.json()['access_token']}"
    }

    response_coord = client.post(
        "/api/v1/usuarios/coordenadores",
        headers=headers,
        json={
            "nome": "Coordenador Acessos",
            "email": email_coord,
            "senha": "123456",
            "ativo": True
        }
    )

    assert response_coord.status_code == 200
    coordenador = response_coord.json()
    assert coordenador["papel"] == "coordenador"

    response_logs = client.get(
        "/api/v1/usuarios/logs",
        headers=headers
    )

    assert response_logs.status_code == 200
    assert any(
        log["recurso"] == "coordenador"
        for log in response_logs.json()
    )

    response_delete_coord = client.delete(
        f"/api/v1/usuarios/coordenadores/{coordenador['id']}",
        headers=headers
    )

    assert response_delete_coord.status_code == 200

    client.delete(f"/api/v1/usuarios/{admin_id}")


def test_coordenador_ativa_e_desativa_alunos_e_professores():
    email_coord = f"coord_ativo_{uuid4().hex[:8]}@teste.com"
    email_professor = f"prof_ativo_{uuid4().hex[:8]}@teste.com"
    email_aluno = f"aluno_ativo_{uuid4().hex[:8]}@teste.com"
    matricula = f"MAT-ATIVO-{uuid4().hex[:8]}"

    response_coord = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Coordenador Ativo",
            "email": email_coord,
            "senha": "123456",
            "papel": "coordenador",
            "ativo": True
        }
    )

    assert response_coord.status_code == 200
    coord_id = response_coord.json()["id"]

    response_login = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_coord,
            "senha": "123456"
        }
    )

    assert response_login.status_code == 200
    headers = {
        "Authorization": f"Bearer {response_login.json()['access_token']}"
    }

    response_professor = client.post(
        "/api/v1/professores/",
        headers=headers,
        json={
            "nome": "Professor Ativação",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    response_aluno = client.post(
        "/api/v1/alunos/",
        headers=headers,
        json={
            "nome": "Aluno Ativação",
            "email": email_aluno,
            "matricula": matricula,
            "curso": "Ciência da Computação",
            "ativo": True
        }
    )

    assert response_aluno.status_code == 200
    aluno_id = response_aluno.json()["id"]

    response_professor_inativo = client.patch(
        f"/api/v1/professores/{professor_id}/ativo",
        headers=headers,
        json={"ativo": False}
    )

    assert response_professor_inativo.status_code == 200
    assert response_professor_inativo.json()["ativo"] is False

    response_aluno_inativo = client.patch(
        f"/api/v1/alunos/{aluno_id}/ativo",
        headers=headers,
        json={"ativo": False}
    )

    assert response_aluno_inativo.status_code == 200
    assert response_aluno_inativo.json()["ativo"] is False

    response_professor_ativo = client.patch(
        f"/api/v1/professores/{professor_id}/ativo",
        headers=headers,
        json={"ativo": True}
    )

    assert response_professor_ativo.status_code == 200
    assert response_professor_ativo.json()["ativo"] is True

    response_aluno_ativo = client.patch(
        f"/api/v1/alunos/{aluno_id}/ativo",
        headers=headers,
        json={"ativo": True}
    )

    assert response_aluno_ativo.status_code == 200
    assert response_aluno_ativo.json()["ativo"] is True

    client.delete(f"/api/v1/alunos/{aluno_id}")
    client.delete(f"/api/v1/professores/{professor_id}")
    client.delete(f"/api/v1/usuarios/{coord_id}")


def test_projeto_exige_resumo_caracteristicas_e_orientador():
    email_professor = f"prof_regra_proj_{uuid4().hex[:8]}@teste.com"

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Regra Projeto",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    response_sem_resumo = client.post(
        "/api/v1/projetos/",
        json={
            "nome": "Projeto Sem Resumo",
            "caracteristicas": "Características obrigatórias",
            "alunos_envolvidos": "Aluno",
            "orientador_id": professor_id
        }
    )

    assert response_sem_resumo.status_code == 422

    response_sem_orientador = client.post(
        "/api/v1/projetos/",
        json={
            "nome": "Projeto Sem Orientador",
            "resumo": "Resumo obrigatório",
            "caracteristicas": "Características obrigatórias",
            "alunos_envolvidos": "Aluno"
        }
    )

    assert response_sem_orientador.status_code == 422

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto Com Orientador",
            orientador_id=professor_id
        )
    )

    assert response_projeto.status_code == 200
    projeto = response_projeto.json()
    projeto_id = projeto["id"]
    assert projeto["resumo"]
    assert projeto["caracteristicas"]
    assert projeto["professores"][0]["papel_no_projeto"] == "orientador"

    response_remove_ultimo_orientador = client.delete(
        f"/api/v1/projetos/{projeto_id}/professores/{professor_id}"
    )

    assert response_remove_ultimo_orientador.status_code == 400

    client.delete(f"/api/v1/projetos/{projeto_id}")
    client.delete(f"/api/v1/professores/{professor_id}")


def test_professor_vinculado_cria_e_edita_historico_projeto():
    email_usuario_professor = f"usuario_prof_hist_{uuid4().hex[:8]}@teste.com"
    email_professor = f"prof_hist_{uuid4().hex[:8]}@teste.com"

    response_usuario_professor = client.post(
        "/api/v1/usuarios/",
        json={
            "nome": "Usuário Professor Histórico",
            "email": email_usuario_professor,
            "senha": "123456",
            "papel": "professor",
            "ativo": True
        }
    )

    assert response_usuario_professor.status_code == 200
    usuario_professor_id = response_usuario_professor.json()["id"]

    response_professor = client.post(
        "/api/v1/professores/",
        json={
            "nome": "Professor Histórico",
            "email": email_professor,
            "departamento": "Computação",
            "ativo": True,
            "usuario_id": usuario_professor_id
        }
    )

    assert response_professor.status_code == 200
    professor_id = response_professor.json()["id"]

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload(
            nome="Projeto com Histórico",
            orientador_id=professor_id
        )
    )

    assert response_projeto.status_code == 200
    projeto_id = response_projeto.json()["id"]

    response_login_professor = client.post(
        "/api/v1/auth/login",
        json={
            "email": email_usuario_professor,
            "senha": "123456"
        }
    )

    assert response_login_professor.status_code == 200
    headers_professor = {
        "Authorization": (
            f"Bearer {response_login_professor.json()['access_token']}"
        )
    }

    response_historico = client.post(
        f"/api/v1/projetos/{projeto_id}/historico",
        headers=headers_professor,
        json={
            "titulo": "Primeira reunião",
            "resumo": "Foram definidos os próximos passos.",
            "decisoes": "Priorizar o MVP.",
            "pendencias": "Enviar documentação.",
            "proximos_passos": "Revisar protótipo."
        }
    )

    assert response_historico.status_code == 200
    historico = response_historico.json()
    assert historico["professor_id"] == professor_id

    response_historico_editado = client.put(
        f"/api/v1/projetos/{projeto_id}/historico/{historico['id']}",
        headers=headers_professor,
        json={
            "resumo": "Resumo atualizado pelo professor orientador."
        }
    )

    assert response_historico_editado.status_code == 200
    assert (
        response_historico_editado.json()["resumo"]
        == "Resumo atualizado pelo professor orientador."
    )

    response_lista = client.get(
        f"/api/v1/projetos/{projeto_id}/historico",
        headers=headers_professor
    )

    assert response_lista.status_code == 200
    assert len(response_lista.json()) == 1

    client.delete(f"/api/v1/projetos/{projeto_id}")
    client.delete(f"/api/v1/professores/{professor_id}")
    client.delete(f"/api/v1/usuarios/{usuario_professor_id}")
