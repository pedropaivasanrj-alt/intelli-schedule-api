"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  ClipboardList,
  GraduationCap,
  Layers3,
  LogOut,
  Users,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { DashboardResumo, Projeto } from "@/lib/types";

export default function DashboardPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [resumo, setResumo] = useState<DashboardResumo | null>(null);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    if (usuario.papel !== "admin" && usuario.papel !== "coordenador") {
      window.location.replace("/projetos");
      return;
    }

    async function carregarDashboard() {
      try {
        const [resumoApi, projetosApi] = await Promise.all([
          apiFetch<DashboardResumo>("/api/v1/dashboard/resumo"),
          apiFetch<Projeto[]>("/api/v1/projetos/"),
        ]);

        setResumo(resumoApi);
        setProjetos(projetosApi);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o dashboard"
        );
      } finally {
        setCarregando(false);
      }
    }

    queueMicrotask(carregarDashboard);
  }, [usuario]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando dashboard...
      </main>
    );
  }

  const indicadores = resumo?.indicadores;
  const projetosSemAgendamento = projetos.filter((projeto) => {
    const proximosIds =
      resumo?.proximos_agendamentos.map((reuniao) => reuniao.projeto_id) ?? [];
    return !proximosIds.includes(projeto.id);
  });

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-10 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Visão gerencial
          </h1>
        </div>

        <button
          onClick={sair}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
        >
          <LogOut size={17} />
          Sair
        </button>
      </nav>

      <section className="mx-auto max-w-7xl space-y-8">
        {erro && (
          <div className="rounded-[1rem] border border-red-300/25 bg-red-300/10 p-4 text-red-100">
            {erro}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Indicador
            icon={<GraduationCap />}
            label="Professores"
            valor={indicadores?.professores ?? 0}
          />
          <Indicador
            icon={<Users />}
            label="Alunos"
            valor={indicadores?.alunos ?? 0}
          />
          <Indicador
            icon={<Layers3 />}
            label="Projetos"
            valor={indicadores?.projetos ?? 0}
          />
          <Indicador
            icon={<CalendarCheck />}
            label="Reuniões"
            valor={indicadores?.reunioes_agendadas ?? 0}
          />
          <Indicador
            icon={<ClipboardList />}
            label="Sem agendamento"
            valor={indicadores?.projetos_sem_agendamento ?? 0}
          />
          <Indicador
            icon={<ClipboardList />}
            label="Sem reunião recente"
            valor={indicadores?.projetos_sem_reuniao_recente ?? 0}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                  Agenda
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Próximos agendamentos
                </h2>
              </div>
              <Link
                href="/agendamentos"
                className="rounded-full bg-white px-5 py-3 text-sm font-bold text-[#2F39E0]"
              >
                Ver agenda
              </Link>
            </div>

            <div className="grid gap-3">
              {(resumo?.proximos_agendamentos ?? []).map((reuniao) => (
                <div
                  key={reuniao.reuniao_id}
                  className="grid gap-3 rounded-[1rem] bg-white/10 p-4 md:grid-cols-[1fr_180px_160px]"
                >
                  <div>
                    <p className="font-bold">
                      {reuniao.projeto_nome ?? "Projeto acadêmico"}
                    </p>
                    <p className="text-sm text-white/60">
                      {reuniao.professor_nome ?? "Professor não informado"}
                    </p>
                  </div>
                  <p className="text-sm text-white/70">
                    {formatarDataHora(reuniao.data_hora_inicio)}
                  </p>
                  <span className="rounded-full bg-white px-4 py-2 text-center text-sm font-bold text-[#2F39E0]">
                    {reuniao.status}
                  </span>
                </div>
              ))}

              {resumo?.proximos_agendamentos.length === 0 && (
                <div className="rounded-[1rem] bg-white/10 p-5 text-white/70">
                  Nenhum agendamento futuro encontrado.
                </div>
              )}
            </div>
          </section>

          <aside className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Atalhos
            </p>
            <h2 className="mt-2 text-2xl font-black">Ações rápidas</h2>

            <div className="mt-6 grid gap-3">
              <Link className="dashboard-link" href="/cadastros">
                Central de cadastros
              </Link>
              <Link className="dashboard-link" href="/projetos">
                Projetos acadêmicos
              </Link>
              <Link className="dashboard-link" href="/cadastros/projetos">
                Novo projeto
              </Link>
            </div>
          </aside>
        </div>

        <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
          <div className="mb-5">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Pendências
            </p>
            <h2 className="mt-2 text-2xl font-black">
              Projetos sem próximo agendamento
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {projetosSemAgendamento.slice(0, 6).map((projeto) => (
              <Link
                key={projeto.id}
                href={`/projetos/${projeto.id}`}
                className="rounded-[1rem] border border-white/10 bg-white/10 p-4 transition hover:bg-white/15"
              >
                <p className="font-bold">{projeto.nome}</p>
                <p className="mt-2 line-clamp-2 text-sm text-white/65">
                  {projeto.resumo}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}

function Indicador({
  icon,
  label,
  valor,
}: {
  icon: React.ReactNode;
  label: string;
  valor: number;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/10 bg-white/10 p-5">
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-[1rem] bg-white text-[#2F39E0]">
        {icon}
      </div>
      <p className="text-4xl font-black">{valor}</p>
      <p className="mt-1 text-sm text-white/65">{label}</p>
    </div>
  );
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}
