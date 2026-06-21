export type PapelUsuario = "admin" | "coordenador" | "professor" | "aluno";

export type UsuarioAutenticado = {
  id: number;
  nome: string;
  email: string;
  papel: PapelUsuario;
};

export type AuthData = {
  access_token: string;
  token_type: string;
  usuario: UsuarioAutenticado;
};

export const AUTH_STORAGE_KEY = "intelli_schedule_auth";

export function salvarAuth(auth: AuthData) {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function obterAuth(): AuthData | null {
  if (typeof window === "undefined") return null;

  const auth = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!auth) return null;

  try {
    return JSON.parse(auth) as AuthData;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}


export function limparAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function destinoPorPapel(papel?: string) {
  if (papel === "admin" || papel === "coordenador") {
    return "/dashboard";
  }

  if (papel === "professor") {
    return "/professor";
  }

  if (papel === "aluno") {
    return "/aluno";
  }

  return "/projetos";
}

export function obterToken(): string | null {
  return obterAuth()?.access_token ?? null;
}

export function obterUsuario(): UsuarioAutenticado | null {
  return obterAuth()?.usuario ?? null;
}

export function usuarioTemPapel(papeisPermitidos: PapelUsuario[]) {
  const usuario = obterUsuario();

  if (!usuario) return false;

  return papeisPermitidos.includes(usuario.papel);
}

export function sair() {
  if (typeof window === "undefined") return;
  limparAuth();
  window.location.href = "/login";
}

export function redirecionarPorPapel(usuario: UsuarioAutenticado) {
  window.location.href = destinoPorPapel(usuario.papel);
}
