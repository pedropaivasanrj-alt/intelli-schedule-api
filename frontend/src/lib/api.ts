import { obterToken } from "./auth";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

type ApiOptions = RequestInit & {
  auth?: boolean;
};

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

    throw new Error(mensagem);
  }

  return response.json();
}
