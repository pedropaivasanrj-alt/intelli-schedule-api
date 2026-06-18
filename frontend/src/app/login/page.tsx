"use client";

import { useState } from "react";
import { CalendarCheck, Lock, Mail, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { AuthData, salvarAuth } from "@/lib/auth";

function destinoPorPapel(papel: string) {
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

export default function LoginPage() {
  
  const [email, setEmail] = useState("coordenador.demo@intelli.com.br");
  const [senha, setSenha] = useState("123456");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function fazerLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<AuthData>("/api/v1/auth/login", {
        method: "POST",
        auth: false,
        body: JSON.stringify({
          email,
          senha,
        }),
      });

salvarAuth(resposta);

const destino = destinoPorPapel(resposta.usuario.papel);

window.location.replace(destino);

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login"
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08112B] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(47,57,224,0.45),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(93,43,225,0.35),_transparent_30%),radial-gradient(circle_at_50%_90%,_rgba(43,167,225,0.35),_transparent_30%)]" />

      <section className="relative z-10 grid min-h-screen items-center px-6 py-10 lg:grid-cols-[1fr_520px] lg:px-20">
        <div className="max-w-3xl">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
              <CalendarCheck size={25} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                Intelli
              </p>
              <h1 className="text-xl font-bold">Schedule</h1>
            </div>
          </div>

          <h2 className="text-5xl font-black tracking-[-0.06em] md:text-7xl">
            Acesse sua agenda acadêmica.
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70">
            Cada perfil visualiza apenas as informações necessárias para sua
            atuação: coordenação, professor ou aluno.
          </p>

          <div className="mt-10 grid max-w-2xl gap-3 md:grid-cols-2">
            <LoginShortcut
              label="Coordenador"
              email="coordenador.demo@intelli.com.br"
              onClick={setEmail}
            />
            <LoginShortcut
              label="Prof. Ana"
              email="ana.martins@intelli.com.br"
              onClick={setEmail}
            />
            <LoginShortcut
              label="Aluno Maria"
              email="maria.oliveira@intelli.com.br"
              onClick={setEmail}
            />
            <LoginShortcut
              label="Admin"
              email="admin.demo@intelli.com.br"
              onClick={setEmail}
            />
            <LoginShortcut
              label="Aluno Lucas"
              email="lucas.almeida@intelli.com.br"
              onClick={setEmail}
            />
          </div>
        </div>

        <form
          onSubmit={fazerLogin}
          className="mt-12 rounded-[2.2rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-2xl lg:mt-0"
        >
          <div className="rounded-[1.7rem] bg-[#0E1738]/80 p-6">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                Login
              </p>
              <h3 className="mt-2 text-3xl font-black">
                Entrar no sistema
              </h3>
            </div>

            <label className="mb-2 block text-sm text-white/70">
              E-mail
            </label>
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <Mail size={18} className="text-white/60" />
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                placeholder="seu.email@exemplo.com"
                type="email"
              />
            </div>

            <label className="mb-2 block text-sm text-white/70">
              Senha
            </label>
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <Lock size={18} className="text-white/60" />
              <input
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                placeholder="Digite sua senha"
                type="password"
              />
            </div>

            {erro && (
              <div className="mb-5 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-sm text-red-100">
                {erro}
              </div>
            )}

            <button
              disabled={carregando}
              className="group flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-4 font-bold text-[#2F39E0] transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {carregando ? "Entrando..." : "Entrar"}
              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </button>

            <p className="mt-5 text-center text-sm text-white/50">
              Senha dos usuários demo: 123456
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}

function LoginShortcut({
  label,
  email,
  onClick,
}: {
  label: string;
  email: string;
  onClick: (email: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(email)}
      className="rounded-2xl border border-white/10 bg-white/10 p-4 text-left backdrop-blur-xl transition hover:bg-white/15"
    >
      <p className="font-semibold">{label}</p>
      <p className="mt-1 text-sm text-white/55">{email}</p>
    </button>
  );
}
