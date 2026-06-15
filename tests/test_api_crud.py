from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


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
    projeto_payload = {
        "nome": "Projeto Teste API",
        "alunos_envolvidos": "Aluno Teste 1, Aluno Teste 2",
        "descricao_foco": "Teste automatizado do fluxo principal"
    }

    response_projeto = client.post(
        "/api/v1/projetos/",
        json=projeto_payload
    )

    assert response_projeto.status_code == 200
    projeto = response_projeto.json()
    assert projeto["nome"] == projeto_payload["nome"]

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
        json={
            "nome": "Projeto Horário Inválido",
            "alunos_envolvidos": "Aluno Teste",
            "descricao_foco": "Teste de horário inválido"
        }
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