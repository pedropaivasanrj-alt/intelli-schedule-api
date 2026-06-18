# Intelli Schedule API

API para agendamento acadêmico inteligente, permitindo organizar reuniões, checkpoints, bancas ou apresentações entre alunos, professores e projetos.

O sistema permite que professores cadastrem suas disponibilidades e que alunos realizem agendamentos dentro dos horários disponíveis, evitando conflitos automaticamente.

## Objetivo do projeto

Reduzir o trabalho manual da coordenação acadêmica no processo de agendamento de reuniões e avaliações, oferecendo uma base estruturada para cadastro de professores, alunos, projetos, disponibilidades e reuniões.

## Funcionalidades principais

* Cadastro de professores
* Cadastro de alunos
* Cadastro de usuários com papéis
* Regra de administrador único
* Cadastro de projetos
* Vínculo entre alunos e projetos
* Cadastro de disponibilidade por data específica
* Agendamento realizado pelo aluno
* Validação automática de conflitos de horário
* Visualização da agenda completa
* Visualização da agenda por professor
* Visualização da agenda por aluno
* Seed de demonstração
* Testes automatizados com Pytest

## Papéis do sistema

O sistema trabalha com os seguintes papéis:

* Admin
* Coordenador
* Professor
* Aluno

## Fluxo principal

1. O professor possui disponibilidade cadastrada.
2. O aluno está vinculado a um projeto.
3. O aluno consulta os horários disponíveis.
4. O aluno escolhe um horário.
5. O sistema valida:

   * se o aluno existe;
   * se o projeto existe;
   * se o professor existe;
   * se o aluno pertence ao projeto;
   * se o professor tem disponibilidade;
   * se não há conflito de horário;
   * se o projeto ainda não possui reunião.
6. A reunião é criada.
7. A agenda pode ser consultada.

## Tecnologias utilizadas

* Python
* FastAPI
* SQLAlchemy
* PostgreSQL
* Docker
* Pydantic
* Pytest

## Como executar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/pedropaivasanrj-alt/intelli-schedule-api.git
cd intelli-schedule-api
```

### 2. Criar ambiente virtual

No Windows PowerShell:

```powershell
python -m venv venv
.\venv\Scripts\Activate
```

### 3. Instalar dependências

```powershell
pip install -r requirements.txt
```

### 4. Subir o banco de dados

```powershell
docker compose up -d
```

Aguarde alguns segundos até o PostgreSQL estar pronto.

Para verificar:

```powershell
docker exec -it intelli_db pg_isready -U admin -d intelli_schedule
```

### 5. Rodar os testes

Para rodar os testes com banco limpo:

```powershell
docker compose down -v
docker compose up -d
Start-Sleep -Seconds 15
pytest -v
```

Resultado esperado:

```text
11 passed
```

### 6. Popular dados de demonstração

Depois que os testes passarem, execute:

```powershell
python scripts/seed_demo.py
```

Esse comando cria dados demonstrativos como usuários, professores, alunos, projetos, disponibilidades e reuniões agendadas pelo fluxo do aluno.

### 7. Rodar a API

```powershell
uvicorn app.main:app --reload
```

Acesse a documentação interativa:

```text
http://127.0.0.1:8000/docs
```

## Endpoints principais

### Status da API

```http
GET /
```

### Professores

```http
GET /api/v1/professores/
POST /api/v1/professores/
GET /api/v1/professores/{professor_id}
DELETE /api/v1/professores/{professor_id}
```

### Alunos

```http
GET /api/v1/alunos/
POST /api/v1/alunos/
GET /api/v1/alunos/{aluno_id}
DELETE /api/v1/alunos/{aluno_id}
```

### Projetos

```http
GET /api/v1/projetos/
POST /api/v1/projetos/
GET /api/v1/projetos/{projeto_id}
DELETE /api/v1/projetos/{projeto_id}
POST /api/v1/projetos/{projeto_id}/alunos/{aluno_id}
GET /api/v1/projetos/{projeto_id}/alunos
DELETE /api/v1/projetos/{projeto_id}/alunos/{aluno_id}
```

### Disponibilidades

```http
GET /api/v1/disponibilidades/
POST /api/v1/disponibilidades/
GET /api/v1/disponibilidades/{disponibilidade_id}
DELETE /api/v1/disponibilidades/{disponibilidade_id}
```

### Reuniões

```http
GET /api/v1/reunioes/
POST /api/v1/reunioes/
GET /api/v1/reunioes/{reuniao_id}
PATCH /api/v1/reunioes/{reuniao_id}/status
DELETE /api/v1/reunioes/{reuniao_id}
```

### Agendamentos

```http
GET /api/v1/agendamentos/horarios-disponiveis
POST /api/v1/agendamentos/aluno/agendar
GET /api/v1/agendamentos/agenda
GET /api/v1/agendamentos/professor/{professor_id}
GET /api/v1/agendamentos/aluno/{aluno_id}
POST /api/v1/agendamentos/gerar
```

## Exemplo de agendamento feito pelo aluno

Endpoint:

```http
POST /api/v1/agendamentos/aluno/agendar
```

Payload:

```json
{
  "aluno_id": 1,
  "projeto_id": 1,
  "professor_id": 1,
  "data_hora_inicio": "2026-06-21T08:00:00"
}
```

Resposta esperada:

```json
{
  "reuniao_id": 1,
  "projeto_id": 1,
  "projeto_nome": "[DEMO] Sistema de Controle de Estágios",
  "professor_id": 1,
  "professor_nome": "Prof. Ana Martins",
  "aluno_id": 1,
  "aluno_nome": "Maria Oliveira",
  "ciclo_avaliacao": "Agendamento realizado pelo aluno",
  "data_hora_inicio": "2026-06-21T08:00:00",
  "data_hora_fim": "2026-06-21T09:00:00",
  "status": "Agendado"
}
```

## Dados de demonstração

O comando:

```powershell
python scripts/seed_demo.py
```

cria os seguintes acessos demonstrativos:

```text
Admin: admin.demo@intelli.com.br | senha: 123456
Coordenador: coordenador.demo@intelli.com.br | senha: 123456
Professor Ana: ana.martins@intelli.com.br | senha: 123456
Aluno Maria: maria.oliveira@intelli.com.br | senha: 123456
Aluno Lucas: lucas.almeida@intelli.com.br | senha: 123456
```

## Observação sobre testes e seed

Os testes devem ser executados com o banco limpo.

Ordem recomendada:

```powershell
docker compose down -v
docker compose up -d
Start-Sleep -Seconds 15
pytest -v
python scripts/seed_demo.py
uvicorn app.main:app --reload
```

O seed cria um administrador demonstrativo. Por isso, se o seed for executado antes dos testes, o teste de administrador único pode falhar, pois a regra de ADM único estará funcionando corretamente.

## Próximas evoluções

* Criar tela web para alunos, professores e coordenação
* Implementar autenticação com login real
* Aplicar permissões por papel
* Adicionar notificações por e-mail
* Exportar agenda em planilha
* Criar painel administrativo
* Implementar migrations com Alembic
