"use client";

import { useEffect, useState } from "react";
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  Lock,
  LogOut,
  Plus,
  Power,
  XCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";

type PeriodoAgendamento = {
  id: number;
  titulo: string;
  descricao?: string | null;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  criado_por_id?: number | null;
};

function podeGerenciarPeriodos(usuario: UsuarioAutenticado | null) {
  return usuario?.papel === "admin" || usuario?.papel === "coordenador";
}

export default function PeriodosPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [periodos, setPeriodos] = useState<PeriodoAgendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    if (!podeGerenciarPeriodos(usuario)) {
      window.location.replace("/acesso-negado");
      return;
    }

    carregarPeriodos();
  }, [usuario]);

  async function carregarPeriodos() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await apiFetch<PeriodoAgendamento[]>(
        "/api/v1/periodos-agendamento/"
      );

      setPeriodos(resposta);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os períodos"
      );
    } finally {
      setCarregando(false);
    }
  }

  async function criarPeriodo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (!titulo || !dataInicio || !dataFim) {
      setErro("Preencha título, data inicial e data final.");
      return;
    }

    setSalvando(true);

    try {
      await apiFetch<PeriodoAgendamento>("/api/v1/periodos-agendamento/", {
        method: "POST",
        body: JSON.stringify({
          titulo,
          descricao,
          data_inicio: dataInicio,
          data_fim: dataFim,
          ativo: true,
        }),
      });

      setMensagem("Período criado e ativado com sucesso.");
      setTitulo("");
      setDescricao("");
      setDataInicio("");
      setDataFim("");

      await carregarPeriodos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar o período"
      );
    } finally {
      setSalvando(false);
    }
  }

  async function ativarPeriodo(periodoId: number) {
    setErro("");
    setMensagem("");

    try {
      await apiFetch<PeriodoAgendamento>(
        `/api/v1/periodos-agendamento/${periodoId}/ativar`,
        {
          method: "PATCH",
        }
      );

      setMensagem("Período ativado com sucesso.");
      await carregarPeriodos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível ativar o período"
      );
    }
  }

  async function encerrarPeriodo(periodoId: number) {
    setErro("");
    setMensagem("");

    try {
      await apiFetch<PeriodoAgendamento>(
        `/api/v1/periodos-agendamento/${periodoId}/encerrar`,
        {
          method: "PATCH",
        }
      );

      setMensagem("Período encerrado com sucesso.");
      await carregarPeriodos();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível encerrar o período"
      );
    }
  }

  const periodoAtivo = periodos.find((periodo) => periodo.ativo);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando períodos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-10 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Coordenação
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Períodos de agendamento
          </h1>

          <p className="mt-3 max-w-2xl text-white/60">
            Defina a janela oficial em que professores podem cadastrar
            disponibilidades e alunos podem realizar agendamentos.
          </p>
        </div>

        <button
          onClick={sair}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
        >
          <LogOut size={17} />
          Sair
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
            <Plus size={26} />
          </div>

          <h2 className="text-2xl font-black">Criar novo período</h2>

          <p className="mt-2 text-sm leading-6 text-white/60">
            Ao criar um novo período ativo, os períodos anteriores serão
            desativados automaticamente.
          </p>

          <form onSubmit={criarPeriodo} className="mt-6 grid gap-4">
            <div>
              <label className="mb-2 block text-sm text-white/70">
                Título
              </label>
              <input
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Ex: Período de reuniões 2026.1"
                className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/70">
                Descrição
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                placeholder="Descrição opcional do período"
                className="min-h-24 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Data inicial
                </label>
                <input
                  value={dataInicio}
                  onChange={(event) => setDataInicio(event.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/70">
                  Data final
                </label>
                <input
                  value={dataFim}
                  onChange={(event) => setDataFim(event.target.value)}
                  type="date"
                  className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                />
              </div>
            </div>

            {erro && (
              <div className="rounded-xl border border-red-300/25 bg-red-300/10 p-3 text-sm text-red-100">
                {erro}
              </div>
            )}

            {mensagem && (
              <div className="rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm text-emerald-100">
                {mensagem}
              </div>
            )}

            <button
              disabled={salvando}
              className="mt-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Criando..." : "Criar e ativar período"}
            </button>
          </form>
        </aside>

        <section className="grid gap-5">
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
                <CalendarRange size={24} />
              </div>

              <div>
                <p className="text-sm text-white/60">Período ativo</p>
                <h2 className="text-2xl font-black">
                  {periodoAtivo
                    ? periodoAtivo.titulo
                    : "Nenhum período ativo"}
                </h2>
              </div>
            </div>

            {periodoAtivo ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoCard
                  icon={<Clock size={18} />}
                  label="Início"
                  value={formatarData(periodoAtivo.data_inicio)}
                />
                <InfoCard
                  icon={<Clock size={18} />}
                  label="Fim"
                  value={formatarData(periodoAtivo.data_fim)}
                />
                <InfoCard
                  icon={<CheckCircle2 size={18} />}
                  label="Status"
                  value="Ativo"
                />
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-yellow-300/25 bg-yellow-300/10 p-4 text-yellow-100">
                Ainda não há janela oficial aberta para agendamentos.
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
            <h2 className="mb-5 text-2xl font-black">Histórico de períodos</h2>

            <div className="grid gap-4">
              {periodos.map((periodo) => (
                <div
                  key={periodo.id}
                  className="rounded-[1.2rem] border border-white/10 bg-white/10 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        {periodo.ativo ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-200"
                          />
                        ) : (
                          <XCircle size={18} className="text-white/35" />
                        )}

                        <h3 className="text-xl font-bold">{periodo.titulo}</h3>
                      </div>

                      <p className="text-sm leading-6 text-white/60">
                        {periodo.descricao || "Sem descrição informada."}
                      </p>

                      <p className="mt-3 text-sm text-white/70">
                        {formatarData(periodo.data_inicio)} até{" "}
                        {formatarData(periodo.data_fim)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {!periodo.ativo && (
                        <button
                          onClick={() => ativarPeriodo(periodo.id)}
                          className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]"
                        >
                          Ativar
                        </button>
                      )}

                      {periodo.ativo && (
                        <button
                          onClick={() => encerrarPeriodo(periodo.id)}
                          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold"
                        >
                          <Power size={15} />
                          Encerrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {periodos.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/10 p-5 text-white/60">
                  Nenhum período cadastrado.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-6 text-white/55">
            <div className="mb-2 flex items-center gap-2 font-bold text-white/80">
              <Lock size={16} />
              Regra do sistema
            </div>
            Professores só devem cadastrar disponibilidade dentro do período
            ativo. Alunos só devem conseguir agendar reuniões dentro desse mesmo
            período.
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm text-white/55">
        {icon}
        {label}
      </div>
      <p className="font-bold">{value}</p>
    </div>
  );
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(`${data}T00:00:00`));
}