"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarCheck, Edit3, LogOut, Plus, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { HistoricoReuniao, Projeto, Reuniao } from "@/lib/types";

const historicoVazio = {
  titulo: "",
  resumo: "",
  decisoes: "",
  pendencias: "",
  proximos_passos: "",
};

export default function ProjetoDetalhePage() {
  const params = useParams();
  const projetoId = String(params.id ?? "");
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [agenda, setAgenda] = useState<Reuniao[]>([]);
  const [historico, setHistorico] = useState<HistoricoReuniao[]>([]);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [editandoResumo, setEditandoResumo] = useState(false);
  const [historicoEditandoId, setHistoricoEditandoId] = useState<number | null>(
    null
  );
  const [formResumo, setFormResumo] = useState({
    resumo: "",
    caracteristicas: "",
    objetivo: "",
  });
  const [formHistorico, setFormHistorico] = useState(historicoVazio);

  const carregarProjeto = useCallback(async () => {
    if (!projetoId) return;

    try {
      const [projetoApi, agendaApi, historicoApi] = await Promise.all([
        apiFetch<Projeto>(`/api/v1/projetos/${projetoId}`),
        apiFetch<Reuniao[]>("/api/v1/agendamentos/agenda"),
        apiFetch<HistoricoReuniao[]>(
          `/api/v1/projetos/${projetoId}/historico`
        ),
      ]);

      setProjeto(projetoApi);
      setAgenda(
        agendaApi.filter((reuniao) => reuniao.projeto_id === projetoApi.id)
      );
      setHistorico(historicoApi);
      setFormResumo({
        resumo: projetoApi.resumo,
        caracteristicas: projetoApi.caracteristicas,
        objetivo: projetoApi.objetivo ?? "",
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o projeto"
      );
    }
  }, [projetoId]);

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    queueMicrotask(carregarProjeto);
  }, [carregarProjeto, usuario]);

  const podeEditar = useMemo(() => {
    if (!usuario || !projeto) return false;

    if (usuario.papel === "admin" || usuario.papel === "coordenador") {
      return true;
    }

    if (usuario.papel === "professor") {
      return projeto.professores.some(
        (professor) => professor.professor_email === usuario.email
      );
    }

    return false;
  }, [projeto, usuario]);

  async function salvarResumo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      const atualizado = await apiFetch<Projeto>(
        `/api/v1/projetos/${projetoId}`,
        {
          method: "PUT",
          body: JSON.stringify(formResumo),
        }
      );
      setProjeto(atualizado);
      setEditandoResumo(false);
      setMensagem("Resumo do projeto atualizado.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel atualizar o projeto"
      );
    }
  }

  async function salvarHistorico(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    const endpoint = historicoEditandoId
      ? `/api/v1/projetos/${projetoId}/historico/${historicoEditandoId}`
      : `/api/v1/projetos/${projetoId}/historico`;

    try {
      await apiFetch<HistoricoReuniao>(endpoint, {
        method: historicoEditandoId ? "PUT" : "POST",
        body: JSON.stringify(formHistorico),
      });

      setHistoricoEditandoId(null);
      setFormHistorico(historicoVazio);
      setMensagem(
        historicoEditandoId
          ? "Registro de historico atualizado."
          : "Registro de historico adicionado."
      );
      carregarProjeto();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar o historico"
      );
    }
  }

  function editarHistorico(item: HistoricoReuniao) {
    setHistoricoEditandoId(item.id);
    setFormHistorico({
      titulo: item.titulo,
      resumo: item.resumo,
      decisoes: item.decisoes ?? "",
      pendencias: item.pendencias ?? "",
      proximos_passos: item.proximos_passos ?? "",
    });
  }

  function cancelarEdicaoHistorico() {
    setHistoricoEditandoId(null);
    setFormHistorico(historicoVazio);
  }

  if (!projeto) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        {erro || "Carregando projeto..."}
      </main>
    );
  }

  const orientadores = projeto.professores.filter(
    (professor) => professor.papel_no_projeto === "orientador"
  );

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-10 flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/projetos"
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80"
          >
            <ArrowLeft size={16} />
            Projetos
          </Link>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Projeto
          </p>
          <h1 className="mt-2 max-w-5xl text-3xl font-black md:text-5xl">
            {projeto.nome}
          </h1>
        </div>
        <button
          onClick={sair}
          className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
        >
          <LogOut size={17} />
          Sair
        </button>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {erro && <Aviso texto={erro} tipo="erro" />}
          {mensagem && <Aviso texto={mensagem} />}

          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                  Visao geral
                </p>
                <h2 className="mt-2 text-2xl font-black">Resumo do projeto</h2>
              </div>
              {podeEditar && (
                <button
                  onClick={() => setEditandoResumo((valor) => !valor)}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#2F39E0]"
                >
                  <Edit3 size={17} />
                  Editar
                </button>
              )}
            </div>

            {editandoResumo ? (
              <form onSubmit={salvarResumo} className="grid gap-3">
                <Textarea
                  label="Resumo"
                  value={formResumo.resumo}
                  onChange={(resumo) =>
                    setFormResumo((atual) => ({ ...atual, resumo }))
                  }
                />
                <Textarea
                  label="Caracteristicas"
                  value={formResumo.caracteristicas}
                  onChange={(caracteristicas) =>
                    setFormResumo((atual) => ({
                      ...atual,
                      caracteristicas,
                    }))
                  }
                />
                <Textarea
                  label="Objetivo"
                  value={formResumo.objetivo}
                  onChange={(objetivo) =>
                    setFormResumo((atual) => ({ ...atual, objetivo }))
                  }
                  required={false}
                />
                <button className="rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
                  Salvar alteracoes
                </button>
              </form>
            ) : (
              <div className="grid gap-5">
                <Bloco titulo="Resumo" texto={projeto.resumo} />
                <Bloco titulo="Caracteristicas" texto={projeto.caracteristicas} />
                <Bloco
                  titulo="Objetivo"
                  texto={projeto.objetivo ?? "Objetivo nao informado"}
                />
              </div>
            )}
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <h2 className="mb-5 text-2xl font-black">Reunioes agendadas</h2>
            <div className="grid gap-3">
              {agenda.map((reuniao) => (
                <div
                  key={reuniao.reuniao_id}
                  className="grid gap-3 rounded-[1rem] bg-white/10 p-4 md:grid-cols-[1fr_180px_130px]"
                >
                  <p className="font-bold">
                    {reuniao.professor_nome ?? "Professor"}
                  </p>
                  <p className="text-sm text-white/65">
                    {formatarDataHora(reuniao.data_hora_inicio)}
                  </p>
                  <span className="rounded-full bg-white px-4 py-2 text-center text-sm font-bold text-[#2F39E0]">
                    {reuniao.status}
                  </span>
                </div>
              ))}

              {agenda.length === 0 && (
                <p className="rounded-[1rem] bg-white/10 p-4 text-white/70">
                  Nenhuma reuniao agendada.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <h2 className="mb-5 text-2xl font-black">Historico de reunioes</h2>

            {podeEditar && (
              <form
                onSubmit={salvarHistorico}
                className="mb-6 grid gap-3 rounded-[1rem] bg-white/10 p-4"
              >
                <Input
                  label="Titulo do registro"
                  value={formHistorico.titulo}
                  onChange={(titulo) =>
                    setFormHistorico((atual) => ({ ...atual, titulo }))
                  }
                />
                <Textarea
                  label="Resumo da reuniao"
                  value={formHistorico.resumo}
                  onChange={(resumo) =>
                    setFormHistorico((atual) => ({ ...atual, resumo }))
                  }
                />
                <Textarea
                  label="Decisoes tomadas"
                  value={formHistorico.decisoes}
                  onChange={(decisoes) =>
                    setFormHistorico((atual) => ({ ...atual, decisoes }))
                  }
                  required={false}
                />
                <Textarea
                  label="Pendencias"
                  value={formHistorico.pendencias}
                  onChange={(pendencias) =>
                    setFormHistorico((atual) => ({ ...atual, pendencias }))
                  }
                  required={false}
                />
                <Textarea
                  label="Proximos passos"
                  value={formHistorico.proximos_passos}
                  onChange={(proximos_passos) =>
                    setFormHistorico((atual) => ({
                      ...atual,
                      proximos_passos,
                    }))
                  }
                  required={false}
                />
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
                    <Plus size={18} />
                    {historicoEditandoId
                      ? "Salvar historico"
                      : "Adicionar historico"}
                  </button>
                  {historicoEditandoId && (
                    <button
                      type="button"
                      onClick={cancelarEdicaoHistorico}
                      className="rounded-full border border-white/15 px-5 py-3 font-bold text-white"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="grid gap-3">
              {historico.map((item) => (
                <article key={item.id} className="rounded-[1rem] bg-white/10 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xl font-black">{item.titulo}</p>
                      <p className="mt-1 text-sm text-white/45">
                        {formatarData(item.data_registro)}
                      </p>
                    </div>
                    {podeEditar && (
                      <button
                        onClick={() => editarHistorico(item)}
                        className="rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/85"
                      >
                        Editar
                      </button>
                    )}
                  </div>
                  <p className="mt-3 leading-7 text-white/75">{item.resumo}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <Mini titulo="Decisoes" texto={item.decisoes} />
                    <Mini titulo="Pendencias" texto={item.pendencias} />
                    <Mini titulo="Proximos passos" texto={item.proximos_passos} />
                  </div>
                </article>
              ))}

              {historico.length === 0 && (
                <p className="rounded-[1rem] bg-white/10 p-4 text-white/70">
                  Nenhum historico registrado.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.25em] text-white/50">
              Status
            </p>
            <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 font-bold text-[#2F39E0]">
              {projeto.status}
            </span>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
              <Users />
              Orientadores
            </h2>
            <div className="grid gap-3">
              {orientadores.map((professor) => (
                <div
                  key={professor.professor_id}
                  className="rounded-[1rem] bg-white/10 p-4"
                >
                  <p className="font-bold">{professor.professor_nome}</p>
                  <p className="text-sm text-white/60">
                    {professor.professor_email}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6 shadow-2xl shadow-black/15 backdrop-blur">
            <h2 className="mb-4 flex items-center gap-2 text-2xl font-black">
              <CalendarCheck />
              Alunos
            </h2>
            <div className="grid gap-3">
              {projeto.alunos.map((aluno) => (
                <div key={aluno.aluno_id} className="rounded-[1rem] bg-white/10 p-4">
                  <p className="font-bold">{aluno.aluno_nome}</p>
                  <p className="text-sm text-white/60">{aluno.aluno_email}</p>
                </div>
              ))}
              {projeto.alunos.length === 0 && (
                <p className="rounded-[1rem] bg-white/10 p-4 text-white/70">
                  Nenhum aluno vinculado.
                </p>
              )}
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}

function Bloco({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.2em] text-white/45">
        {titulo}
      </p>
      <p className="mt-2 leading-8 text-white/78">{texto}</p>
    </div>
  );
}

function Mini({ titulo, texto }: { titulo: string; texto?: string | null }) {
  return (
    <div className="rounded-[0.9rem] bg-white/10 p-4">
      <p className="font-bold">{titulo}</p>
      <p className="mt-2 text-sm leading-6 text-white/65">
        {texto || "Nao informado"}
      </p>
    </div>
  );
}

function Input({
  value,
  label,
  onChange,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/70">
      {label}
      <input
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

function Textarea({
  value,
  label,
  onChange,
  required = true,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-white/70">
      {label}
      <textarea
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
      />
    </label>
  );
}

function Aviso({ texto, tipo }: { texto: string; tipo?: "erro" }) {
  return (
    <div
      className={`rounded-[1rem] border p-4 ${
        tipo === "erro"
          ? "border-red-300/25 bg-red-300/10 text-red-100"
          : "border-white/15 bg-white/10 text-white/80"
      }`}
    >
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

function formatarData(valor?: string | null) {
  if (!valor) return "Sem data";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}
