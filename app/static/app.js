const state = {
  token: localStorage.getItem("intelli_token") || "",
  usuario: JSON.parse(localStorage.getItem("intelli_usuario") || "null"),
  professores: [],
  alunos: [],
  projetos: [],
  disponibilidades: [],
  agenda: []
};

const pageMeta = {
  dashboard: ["Dashboard da Coordenação", "Visão geral para acompanhamento de professores, alunos, projetos e reuniões."],
  professores: ["Professores", "Cadastro e gerenciamento dos orientadores e avaliadores."],
  alunos: ["Alunos", "Cadastro dos alunos que participarão dos projetos e reuniões."],
  projetos: ["Projetos", "Cadastro com resumo obrigatório, características e orientador vinculado."],
  disponibilidades: ["Disponibilidades", "Agenda dos professores por data específica."],
  agendamentos: ["Agendamentos", "Criação de reuniões com validação automática de disponibilidade."],
  historico: ["Histórico de reuniões", "Registro de acompanhamento dos projetos."],
};

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function showMessage(message, type = "success") {
  const box = $("#app-message");
  box.textContent = message;
  box.className = `notice ${type}`;
  box.hidden = false;
  setTimeout(() => { box.hidden = true; }, 5200);
}

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function formatDate(value) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function professorName(id) {
  const item = state.professores.find((professor) => Number(professor.id) === Number(id));
  return item ? item.nome : "-";
}

function optionHtml(items, labelFn, includeEmpty = true) {
  const empty = includeEmpty ? '<option value="">Selecione</option>' : "";
  return empty + items.map((item) => `<option value="${item.id}">${labelFn(item)}</option>`).join("");
}

async function fetchJson(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(path, { ...options, headers });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!response.ok) {
    const detail = data && data.detail ? data.detail : "Erro ao conversar com a API";
    throw new Error(Array.isArray(detail) ? detail.map((item) => item.msg).join("; ") : detail);
  }
  return data;
}

async function checkApiStatus() {
  try {
    const result = await fetchJson("/");
    $("#api-status").textContent = result.status === "ok" ? "Online" : "Indisponível";
  } catch {
    $("#api-status").textContent = "Indisponível";
  }
}

async function loadAll() {
  await checkApiStatus();
  const [professores, alunos, projetos, disponibilidades, agenda] = await Promise.all([
    fetchJson("/api/v1/professores/"),
    fetchJson("/api/v1/alunos/"),
    fetchJson("/api/v1/projetos/"),
    fetchJson("/api/v1/disponibilidades/"),
    fetchJson("/api/v1/agendamentos/agenda"),
  ]);

  state.professores = professores || [];
  state.alunos = alunos || [];
  state.projetos = projetos || [];
  state.disponibilidades = disponibilidades || [];
  state.agenda = agenda || [];

  renderAll();
}

function renderAll() {
  renderProfile();
  renderMetrics();
  renderSelects();
  renderProfessores();
  renderAlunos();
  renderProjetos();
  renderDisponibilidades();
  renderAgenda();
  renderDashboard();
}

function renderProfile() {
  if (!state.usuario) return;
  $("#current-user-name").textContent = state.usuario.nome || state.usuario.email || "Usuário autenticado";
  $("#current-user-role").textContent = state.usuario.papel || "perfil";
}

function renderMetrics() {
  $("#metric-professores").textContent = state.professores.length;
  $("#metric-alunos").textContent = state.alunos.length;
  $("#metric-projetos").textContent = state.projetos.length;
  $("#metric-reunioes").textContent = state.agenda.length;
}

function renderSelects() {
  const professorOptions = optionHtml(state.professores, (item) => item.nome);
  const alunoOptions = optionHtml(state.alunos, (item) => `${item.nome}${item.matricula ? ` · ${item.matricula}` : ""}`);
  const projetoOptions = optionHtml(state.projetos, (item) => item.nome);

  ["#projeto-orientador-select", "#disponibilidade-professor-select", "#agendamento-professor-select"].forEach((selector) => {
    const el = $(selector);
    if (el) el.innerHTML = professorOptions;
  });
  ["#projeto-aluno-select", "#agendamento-aluno-select"].forEach((selector) => {
    const el = $(selector);
    if (el) el.innerHTML = alunoOptions;
  });
  ["#agendamento-projeto-select", "#historico-projeto-select"].forEach((selector) => {
    const el = $(selector);
    if (el) el.innerHTML = projetoOptions;
  });
}

function renderProfessores() {
  const body = $("#professores-table");
  body.innerHTML = state.professores.map((item) => `
    <tr>
      <td>${item.nome}</td>
      <td>${item.email}</td>
      <td>${item.departamento || "-"}</td>
      <td><span class="tag ${item.ativo ? "success" : "gray"}">${item.ativo ? "Ativo" : "Inativo"}</span></td>
    </tr>
  `).join("") || `<tr><td colspan="4">Nenhum professor cadastrado.</td></tr>`;
}

function renderAlunos() {
  const body = $("#alunos-table");
  body.innerHTML = state.alunos.map((item) => `
    <tr>
      <td>${item.nome}</td>
      <td>${item.email}</td>
      <td>${item.matricula || "-"}</td>
      <td>${item.curso || "-"}</td>
    </tr>
  `).join("") || `<tr><td colspan="4">Nenhum aluno cadastrado.</td></tr>`;
}

function renderProjetos() {
  const body = $("#projetos-table");
  body.innerHTML = state.projetos.map((item) => {
    const orientadores = (item.professores || []).map((professor) => `${professor.professor_nome || "Professor"} (${professor.papel_no_projeto})`).join(", ");
    const alunos = (item.alunos || []).map((aluno) => aluno.aluno_nome).join(", ");
    return `
      <tr>
        <td>${item.nome}</td>
        <td>${orientadores || "-"}</td>
        <td>${alunos || item.alunos_envolvidos || "-"}</td>
        <td><span class="tag success">${item.status || "Ativo"}</span></td>
      </tr>
    `;
  }).join("") || `<tr><td colspan="4">Nenhum projeto cadastrado.</td></tr>`;
}

function renderDisponibilidades() {
  const body = $("#disponibilidades-table");
  body.innerHTML = state.disponibilidades.map((item) => `
    <tr>
      <td>${professorName(item.professor_id)}</td>
      <td>${formatDate(item.data)}</td>
      <td>${item.hora_inicio} - ${item.hora_fim}</td>
    </tr>
  `).join("") || `<tr><td colspan="3">Nenhuma disponibilidade cadastrada.</td></tr>`;
}

function renderAgenda() {
  const body = $("#agenda-table");
  body.innerHTML = state.agenda.map((item) => `
    <tr>
      <td>${item.projeto_nome || "-"}</td>
      <td>${item.professor_nome || "-"}</td>
      <td>${item.aluno_nome || "-"}</td>
      <td>${formatDateTime(item.data_hora_inicio)}</td>
      <td><span class="tag success">${item.status || "Agendado"}</span></td>
    </tr>
  `).join("") || `<tr><td colspan="5">Nenhuma reunião agendada.</td></tr>`;
}

function renderDashboard() {
  const agendaBox = $("#dashboard-agenda");
  const agenda = [...state.agenda]
    .sort((a, b) => new Date(a.data_hora_inicio) - new Date(b.data_hora_inicio))
    .slice(0, 5);

  agendaBox.innerHTML = agenda.map((item) => `
    <div class="timeline-item">
      <div class="timeline-time">${formatDateTime(item.data_hora_inicio).split(" ").pop() || "-"}</div>
      <div>
        <strong>${item.projeto_nome || "Projeto"}</strong>
        <span>${item.professor_nome || "Professor"} · ${item.aluno_nome || "Aluno não informado"} · ${formatDateTime(item.data_hora_inicio)}</span>
      </div>
    </div>
  `).join("") || `<div class="empty-state">Nenhum agendamento encontrado.</div>`;

  const projetosBox = $("#dashboard-projetos");
  projetosBox.innerHTML = state.projetos.slice(0, 5).map((item) => `
    <div class="mini-card">
      <strong>${item.nome}</strong>
      <span>${item.resumo || "Projeto sem resumo."}</span>
    </div>
  `).join("") || `<div class="empty-state">Nenhum projeto cadastrado.</div>`;
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function resetForm(form) {
  form.reset();
}

async function handleProfessorSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  await fetchJson("/api/v1/professores/", {
    method: "POST",
    body: JSON.stringify({ ...data, ativo: true, usuario_id: null })
  });
  showMessage("Professor cadastrado com sucesso.");
  resetForm(form);
  await loadAll();
}

async function handleAlunoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  await fetchJson("/api/v1/alunos/", {
    method: "POST",
    body: JSON.stringify({ ...data, ativo: true, usuario_id: null })
  });
  showMessage("Aluno cadastrado com sucesso.");
  resetForm(form);
  await loadAll();
}

async function handleProjetoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  const alunoId = data.aluno_id;

  const projeto = await fetchJson("/api/v1/projetos/", {
    method: "POST",
    body: JSON.stringify({
      nome: data.nome,
      resumo: data.resumo,
      caracteristicas: data.caracteristicas,
      objetivo: data.objetivo || null,
      descricao_foco: data.caracteristicas,
      alunos_envolvidos: "",
      status: "Ativo",
      orientador_id: Number(data.orientador_id)
    })
  });

  if (alunoId) {
    await fetchJson(`/api/v1/projetos/${projeto.id}/alunos/${alunoId}`, { method: "POST" });
  }

  showMessage("Projeto cadastrado com sucesso.");
  resetForm(form);
  await loadAll();
}

async function handleDisponibilidadeSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  await fetchJson("/api/v1/disponibilidades/", {
    method: "POST",
    body: JSON.stringify({
      professor_id: Number(data.professor_id),
      data: data.data,
      hora_inicio: data.hora_inicio,
      hora_fim: data.hora_fim
    })
  });
  showMessage("Disponibilidade cadastrada com sucesso.");
  resetForm(form);
  await loadAll();
}

async function handleAgendamentoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);
  await fetchJson("/api/v1/agendamentos/aluno/agendar", {
    method: "POST",
    body: JSON.stringify({
      aluno_id: Number(data.aluno_id),
      projeto_id: Number(data.projeto_id),
      professor_id: Number(data.professor_id),
      data_hora_inicio: `${data.data}T${data.hora}:00`
    })
  });
  showMessage("Reunião agendada com sucesso.");
  resetForm(form);
  await loadAll();
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const data = readForm(event.currentTarget);
  const result = await fetchJson("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(data)
  });
  state.token = result.access_token;
  state.usuario = result.usuario;
  localStorage.setItem("intelli_token", state.token);
  localStorage.setItem("intelli_usuario", JSON.stringify(state.usuario));
  renderProfile();
  showMessage("Login realizado com sucesso.");
}

async function handleHistoricoSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = readForm(form);

  if (!state.token) {
    showMessage("Faça login antes de registrar histórico.", "error");
    return;
  }

  await fetchJson(`/api/v1/projetos/${data.projeto_id}/historico`, {
    method: "POST",
    body: JSON.stringify({
      titulo: data.titulo,
      resumo: data.resumo,
      decisoes: data.decisoes || null,
      proximos_passos: data.proximos_passos || null,
      pendencias: null,
      reuniao_id: null,
      professor_id: null
    })
  });
  showMessage("Histórico registrado com sucesso.");
  resetForm(form);
}

function setupNavigation() {
  $all(".menu button").forEach((button) => {
    button.addEventListener("click", () => {
      $all(".menu button").forEach((item) => item.classList.remove("active"));
      $all(".page").forEach((page) => page.classList.remove("active"));
      button.classList.add("active");
      $(`#${button.dataset.page}`).classList.add("active");
      const [title, subtitle] = pageMeta[button.dataset.page];
      $("#page-title").textContent = title;
      $("#page-subtitle").textContent = subtitle;
    });
  });

  $("#open-agendamento-button").addEventListener("click", () => {
    document.querySelector('.menu button[data-page="agendamentos"]').click();
  });
}

function setupForms() {
  $("#professor-form").addEventListener("submit", wrapSubmit(handleProfessorSubmit));
  $("#aluno-form").addEventListener("submit", wrapSubmit(handleAlunoSubmit));
  $("#projeto-form").addEventListener("submit", wrapSubmit(handleProjetoSubmit));
  $("#disponibilidade-form").addEventListener("submit", wrapSubmit(handleDisponibilidadeSubmit));
  $("#agendamento-form").addEventListener("submit", wrapSubmit(handleAgendamentoSubmit));
  $("#login-form").addEventListener("submit", wrapSubmit(handleLoginSubmit));
  $("#historico-form").addEventListener("submit", wrapSubmit(handleHistoricoSubmit));
  $("#refresh-button").addEventListener("click", wrapSubmit(loadAll));
}

function wrapSubmit(handler) {
  return async function(event) {
    try {
      await handler(event);
    } catch (error) {
      showMessage(error.message || "Erro inesperado.", "error");
    }
  };
}

setupNavigation();
setupForms();
renderProfile();
loadAll().catch((error) => showMessage(error.message || "Não foi possível carregar os dados.", "error"));
