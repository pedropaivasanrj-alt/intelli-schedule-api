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

const AUTH_STORAGE_KEY = "intelli_schedule_auth";

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
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.location.href = "/login";
}

export function redirecionarPorPapel(usuario: UsuarioAutenticado) {
  if (usuario.papel === "admin" || usuario.papel === "coordenador") {
    window.location.href = "/dashboard";
    return;
  }

  if (usuario.papel === "professor") {
    window.location.href = "/professor";
    return;
  }

  if (usuario.papel === "aluno") {
    window.location.href = "/aluno";
    return;
  }

  window.location.href = "/login";
}
