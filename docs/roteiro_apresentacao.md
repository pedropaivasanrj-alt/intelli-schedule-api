# Roteiro de Apresentação — Intelli Schedule API

## Objetivo da demonstração

Apresentar um sistema de agendamento acadêmico que permite organizar reuniões, bancas ou checkpoints entre alunos, projetos e professores, respeitando as disponibilidades cadastradas e evitando conflitos de horário.

## Mensagem principal

O sistema permite que o próprio aluno realize o agendamento da sua reunião acadêmica, escolhendo horários disponíveis dos professores. A API valida automaticamente se o aluno pertence ao projeto, se o professor está disponível e se já existe conflito de horário.

## Fluxo demonstrado

1. O sistema possui usuários com papéis: administrador, coordenador, professor e aluno.
2. Professores são cadastrados com seus dados acadêmicos.
3. Alunos são cadastrados e vinculados a projetos.
4. Professores cadastram suas disponibilidades por data específica.
5. O aluno consulta os horários disponíveis.
6. O aluno agenda a reunião.
7. O sistema impede conflitos e registra a agenda final.
8. Coordenador, professor ou aluno podem visualizar os agendamentos.

## Dados de demonstração

O seed cria os seguintes dados:

* Administrador Geral
* Coordenador Acadêmico
* Prof. Ana Martins
* Prof. Carlos Souza
* Maria Oliveira
* Pedro Lima
* Lucas Almeida
* Três projetos acadêmicos de demonstração
* Disponibilidades dos professores
* Três agendamentos realizados pelo fluxo do aluno

## Acessos demonstrativos

* Admin: [admin.demo@intelli.com.br](mailto:admin.demo@intelli.com.br) | senha: 123456
* Coordenador: [coordenador.demo@intelli.com.br](mailto:coordenador.demo@intelli.com.br) | senha: 123456
* Professor Ana: [ana.martins@intelli.com.br](mailto:ana.martins@intelli.com.br) | senha: 123456
* Aluno Maria: [maria.oliveira@intelli.com.br](mailto:maria.oliveira@intelli.com.br) | senha: 123456
* Aluno Lucas: [lucas.almeida@intelli.com.br](mailto:lucas.almeida@intelli.com.br) | senha: 123456

## Ordem de demonstração no Swagger

Acessar:

http://127.0.0.1:8000/docs

### 1. Verificar se a API está funcionando

Endpoint:

GET /

Resultado esperado:

{
"status": "ok"
}

### 2. Listar professores

Endpoint:

GET /api/v1/professores/

Objetivo:

Mostrar os professores disponíveis no sistema.

### 3. Listar alunos

Endpoint:

GET /api/v1/alunos/

Objetivo:

Mostrar os alunos cadastrados.

### 4. Listar projetos

Endpoint:

GET /api/v1/projetos/

Objetivo:

Mostrar os projetos acadêmicos cadastrados.

### 5. Visualizar horários disponíveis

Endpoint:

GET /api/v1/agendamentos/horarios-disponiveis

Parâmetro:

data = 2026-06-21

Objetivo:

Mostrar que o sistema calcula horários livres a partir das disponibilidades dos professores.

### 6. Visualizar agenda completa

Endpoint:

GET /api/v1/agendamentos/agenda

Objetivo:

Mostrar as reuniões já agendadas pelo fluxo do aluno.

### 7. Visualizar agenda por professor

Endpoint:

GET /api/v1/agendamentos/professor/{professor_id}

Objetivo:

Mostrar como um professor consegue acompanhar sua agenda.

### 8. Visualizar agenda por aluno

Endpoint:

GET /api/v1/agendamentos/aluno/{aluno_id}

Objetivo:

Mostrar como um aluno consegue acompanhar seus projetos e reuniões.

## Ponto forte da solução

O sistema reduz trabalho manual da coordenação, evita choque de horários e organiza o processo de agendamento acadêmico de forma rastreável.

## Próximas evoluções

* Tela web para alunos e professores.
* Login com autenticação.
* Permissões por papel.
* Notificações por e-mail.
* Exportação da agenda.
* Painel administrativo.
