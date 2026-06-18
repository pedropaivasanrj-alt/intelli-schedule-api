"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, LogOut, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { Projeto, Reuniao } from "@/lib/types";

export default function ProjetosPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [agenda, setAgenda] = useState<Reuniao[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    async function carregarProjetos() {
      try {
        const [projetosApi, agendaApi] = await Promise.all([
          apiFetch<Projeto[]>("/api/v1/projetos/"),
          apiFetch<Reuniao[]>("/api/v1/agendamentos/agenda"),
        ]);
        setProjetos(projetosApi);
        setAgenda(agendaApi);
      } finally {
        setCarregando(false);
      }
    }

    carregarProjetos();
  }, [usuario]);

  const projetosOrdenados = useMemo(() => {
    return [...projetos].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [projetos]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando projetos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-12 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Projetos
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Projetos acadêmicos
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

      <section className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 xl:grid-cols-3">
        {projetosOrdenados.map((projeto) => {
          const proximo = agenda
            .filter((reuniao) => reuniao.projeto_id === projeto.id)
            .sort((a, b) =>
              a.data_hora_inicio.localeCompare(b.data_hora_inicio)
            )[0];
          const orientador = projeto.professores.find(
            (professor) => professor.papel_no_projeto === "orientador"
          );

          return (
            <a
              key={projeto.id}
              href={`/projetos/${projeto.id}`}
              className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 transition hover:-translate-y-1 hover:bg-white/15"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-black">{projeto.nome}</h2>
                <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]">
                  {projeto.status}
                </span>
              </div>

              <p className="line-clamp-3 min-h-[84px] leading-7 text-white/70">
                {projeto.resumo}
              </p>

              <div className="mt-6 grid gap-3">
                <Info
                  icon={<Users size={17} />}
                  texto={`Orientador: ${
                    orientador?.professor_nome ?? "Não informado"
                  }`}
                />
                <Info
                  icon={<Users size={17} />}
                  texto={`${projeto.alunos.length} aluno(s) vinculado(s)`}
                />
                <Info
                  icon={<CalendarCheck size={17} />}
                  texto={
                    proximo
                      ? `Próximo: ${formatarDataHora(
                          proximo.data_hora_inicio
                        )}`
                      : "Sem próximo agendamento"
                  }
                />
              </div>

              <span className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
                Ver detalhes
              </span>
            </a>
          );
        })}
      </section>
    </main>
  );
}

function Info({ icon, texto }: { icon: React.ReactNode; texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-[0.9rem] bg-white/10 px-3 py-2 text-sm text-white/75">
      {icon}
      {texto}
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
