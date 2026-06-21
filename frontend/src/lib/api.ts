import { limparAuth, obterToken } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

function redirecionarAcessoNegado(status: number) {
  if (typeof window === "undefined") return;

  const destinoAtual = `${window.location.pathname}${window.location.search}`;

  if (status === 401) {
    limparAuth();
    window.location.href = `/login?redirect=${encodeURIComponent(destinoAtual)}`;
    return;
  }

  if (status === 403) {
    window.location.href = `/acesso-negado?from=${encodeURIComponent(
      destinoAtual
    )}`;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = obterToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.headers) {
    new Headers(options.headers).forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (options.auth !== false && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let mensagem = "Erro na requisição";

    try {
      const erro = await response.json();
      mensagem = erro.detail || mensagem;
    } catch {
      mensagem = response.statusText;
    }

    if (response.status === 401 || response.status === 403) {
      redirecionarAcessoNegado(response.status);
    }

    throw new Error(mensagem);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}
