import { PapelUsuario, UsuarioAutenticado } from "./auth";

export function ehAdmin(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin";
}

export function ehCoordenador(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "coordenador";
}

export function ehProfessor(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "professor";
}

export function ehAluno(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "aluno";
}

export function podeVerDashboard(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeVerCadastros(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeGerenciarUsuarios(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin";
}

export function podeGerenciarPeriodos(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeGerenciarProjetos(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeGerenciarAlunos(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeGerenciarProfessores(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeGerenciarVinculos(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function podeVerTodosProjetos(usuario?: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export function destinoPadraoPorPapel(papel?: PapelUsuario | string) {
  if (papel === "admin" || papel === "coordenador") {
    return "/dashboard";
  }

  if (papel === "professor") {
    return "/projetos";
  }

  if (papel === "aluno") {
    return "/agendamentos";
  }

  return "/login";
}