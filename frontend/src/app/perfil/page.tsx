"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, LockKeyhole, Mail, UserRound } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, UsuarioAutenticado } from "@/lib/auth";

export default function PerfilPage() {
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(() =>
    obterUsuario()
  );

  const [erro, setErro] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    async function carregarUsuarioAtual() {
      try {
        const usuarioApi = await apiFetch<UsuarioAutenticado>("/api/v1/auth/me");
        setUsuario(usuarioApi);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar seu perfil"
        );
      }
    }

    carregarUsuarioAtual();
  }, [usuario]);

  async function alterarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");
    setSalvandoSenha(true);

    try {
      const resposta = await apiFetch<{ message: string }>(
        "/api/v1/auth/alterar-senha",
        {
          method: "POST",
          body: JSON.stringify({
            senha_atual: senhaAtual,
            nova_senha: novaSenha,
            confirmar_nova_senha: confirmarNovaSenha,
          }),
        }
      );

      setMensagem(resposta.message);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarNovaSenha("");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar a senha"
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-12 text-white md:px-14 lg:px-20">
      <section className="mx-auto max-w-5xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Perfil
        </p>

        <h1 className="mt-3 text-4xl font-black md:text-6xl">
          Minhas informações
        </h1>

        {erro && (
          <div className="mt-6 rounded-[1rem] border border-red-300/25 bg-red-300/10 p-4 text-red-100">
            {erro}
          </div>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="rounded-[2rem] border border-white/10 bg-white/10 p-7 backdrop-blur-xl">
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
              <UserRound size={30} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard
                label="Nome"
                value={usuario?.nome ?? "Não informado"}
              />

              <InfoCard
                label="Perfil"
                value={usuario?.papel ?? "Não informado"}
              />

              <InfoCard
                label="E-mail"
                value={usuario?.email ?? "Não informado"}
                icon={<Mail size={18} />}
              />

              <InfoCard
                label="ID do usuário"
                value={String(usuario?.id ?? "-")}
              />
            </div>
          </section>

          <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-7 backdrop-blur-xl">
            <h2 className="text-2xl font-black">Ações da conta</h2>

            <p className="mt-2 text-white/60">
              Use esta área para confirmar seu perfil e acessar as principais
              funções do sistema.
            </p>

            <div className="mt-6 grid gap-3">
              <Link className="nav-pill justify-center" href="/agendamentos">
                <CalendarCheck size={16} />
                Realizar agendamento
              </Link>

              <Link className="nav-pill justify-center" href="/projetos">
                <CalendarCheck size={16} />
                Ver projetos
              </Link>

              <form
                onSubmit={alterarSenha}
                className="mt-4 rounded-[1.2rem] border border-white/10 bg-white/10 p-4"
              >
                <div className="mb-4 flex items-center gap-2 font-bold">
                  <LockKeyhole size={18} />
                  Alterar senha
                </div>

                <input
                  value={senhaAtual}
                  onChange={(event) => setSenhaAtual(event.target.value)}
                  className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
                  type="password"
                  placeholder="Senha atual"
                />

                <input
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  className="mb-3 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
                  type="password"
                  placeholder="Nova senha"
                />

                <input
                  value={confirmarNovaSenha}
                  onChange={(event) =>
                    setConfirmarNovaSenha(event.target.value)
                  }
                  className="mb-4 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/40"
                  type="password"
                  placeholder="Confirmar nova senha"
                />

                {mensagem && (
                  <div className="mb-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                    {mensagem}
                  </div>
                )}

                <button
                  disabled={salvandoSenha}
                  className="w-full rounded-full bg-white px-4 py-3 text-sm font-bold text-[#2F39E0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvandoSenha ? "Salvando..." : "Salvar nova senha"}
                </button>
              </form>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/10 p-5">
      <div className="mb-3 flex items-center gap-2 text-sm text-white/55">
        {icon}
        {label}
      </div>

      <p className="break-words text-xl font-bold capitalize">{value}</p>
    </div>
  );
}