"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Clock,
  GraduationCap,
  Layers3,
  LogOut,
  Search,
  User,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";

type Reuniao = {
  reuniao_id: number;
  projeto_id: number;
  projeto_nome: string | null;
  professor_id: number;
  professor_nome: string | null;
  aluno_id: number | null;
  aluno_nome: string | null;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
};

type Professor = {
  id: number;
  nome: string;
  email: string;
};

type Aluno = {
  id: number;
  nome: string;
  email: string;
};

type Projeto = {
  id: number;
  nome: string;
  alunos_envolvidos: string;
  professores: {
    professor_id: number;
    professor_nome?: string | null;
    papel_no_projeto: string;
  }[];
};

type HorarioDisponivel = {
  professor_id: number;
  professor_nome: string;
  data_hora_inicio: string;
  data_hora_fim: string;
};

type AgendaPorPerfil = {
  reunioes: Reuniao[];
};

export default function AgendamentosPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [agenda, setAgenda] = useState<Reuniao[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [alunoAtual, setAlunoAtual] = useState<Aluno | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [dataSelecionada, setDataSelecionada] = useState("2026-06-21");
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState("");
  const [horarios, setHorarios] = useState<HorarioDisponivel[]>([]);
  const [horarioSelecionado, setHorarioSelecionado] = useState("");
  const [buscandoHorarios, setBuscandoHorarios] = useState(false);
  const [agendando, setAgendando] = useState(false);

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    const usuarioAtual = usuario;

    async function carregarDados() {
      try {
        const [listaProfessores, listaAlunos, listaProjetos] =
          await Promise.all([
            apiFetch<Professor[]>("/api/v1/professores/"),
            apiFetch<Aluno[]>("/api/v1/alunos/"),
            apiFetch<Projeto[]>("/api/v1/projetos/"),
          ]);

        const alunoEncontrado = listaAlunos.find(
          (aluno) => aluno.email === usuarioAtual.email
        );
        const professorEncontrado = listaProfessores.find(
          (professor) => professor.email === usuarioAtual.email
        );

        let reunioes: Reuniao[] = [];

        if (usuarioAtual.papel === "aluno" && alunoEncontrado) {
          const agendaAluno = await apiFetch<AgendaPorPerfil>(
            `/api/v1/agendamentos/aluno/${alunoEncontrado.id}`
          );
          reunioes = agendaAluno.reunioes;
        } else if (
          usuarioAtual.papel === "professor" &&
          professorEncontrado
        ) {
          const agendaProfessor = await apiFetch<AgendaPorPerfil>(
            `/api/v1/agendamentos/professor/${professorEncontrado.id}`
          );
          reunioes = agendaProfessor.reunioes;
        } else {
          reunioes = await apiFetch<Reuniao[]>("/api/v1/agendamentos/agenda");
        }

        setProjetos(listaProjetos);
        setAlunoAtual(alunoEncontrado ?? null);
        const primeiroProjeto = listaProjetos[0];
        const primeiroProfessorVinculado =
          primeiroProjeto?.professores[0]?.professor_id;
        setProfessorSelecionado(
          primeiroProfessorVinculado
            ? String(primeiroProfessorVinculado)
            : ""
        );
        setProjetoSelecionado(
          listaProjetos[0] ? String(listaProjetos[0].id) : ""
        );
        setAgenda(reunioes);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar os agendamentos"
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [usuario]);

  const proximasReunioes = useMemo(() => {
    return [...agenda].sort((a, b) =>
      a.data_hora_inicio.localeCompare(b.data_hora_inicio)
    );
  }, [agenda]);

  const professoresDoProjetoSelecionado = useMemo(() => {
    const projeto = projetos.find(
      (item) => item.id === Number(projetoSelecionado)
    );

    return projeto?.professores ?? [];
  }, [projetoSelecionado, projetos]);

  async function buscarHorarios() {
    if (!professorSelecionado || !dataSelecionada) return;

    setBuscandoHorarios(true);
    setMensagem("");
    setErro("");

    try {
      const resposta = await apiFetch<HorarioDisponivel[]>(
        `/api/v1/agendamentos/horarios-disponiveis?data=${dataSelecionada}&professor_id=${professorSelecionado}`
      );
      setHorarios(resposta);
      setHorarioSelecionado(resposta[0]?.data_hora_inicio ?? "");

      if (resposta.length === 0) {
        setMensagem("Nenhum horário disponível para a data escolhida.");
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível buscar horários"
      );
    } finally {
      setBuscandoHorarios(false);
    }
  }

  async function realizarAgendamento(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!alunoAtual) {
      setErro("Não encontrei um cadastro de aluno vinculado a este login.");
      return;
    }

    if (!projetoSelecionado || !professorSelecionado || !horarioSelecionado) {
      setErro("Selecione projeto, professor e horário antes de agendar.");
      return;
    }

    setAgendando(true);
    setErro("");
    setMensagem("");

    try {
      const novoAgendamento = await apiFetch<Reuniao>(
        "/api/v1/agendamentos/aluno/agendar",
        {
          method: "POST",
          body: JSON.stringify({
            aluno_id: alunoAtual.id,
            projeto_id: Number(projetoSelecionado),
            professor_id: Number(professorSelecionado),
            data_hora_inicio: horarioSelecionado,
          }),
        }
      );

      setAgenda((agendaAtual) => [...agendaAtual, novoAgendamento]);
      setHorarios((horariosAtuais) =>
        horariosAtuais.filter(
          (horario) => horario.data_hora_inicio !== horarioSelecionado
        )
      );
      setHorarioSelecionado("");
      setMensagem("Agendamento realizado com sucesso.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o agendamento"
      );
    } finally {
      setAgendando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando agendamentos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-12 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Agendamentos
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">
            {tituloPorPapel(usuario?.papel)}
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

      <section className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[350px_1fr]">
        <aside className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-[1rem] bg-white text-[#2F39E0]">
            <User />
          </div>

          <p className="text-white/60">Usuário</p>
          <h2 className="mt-1 text-2xl font-black">{usuario?.nome}</h2>
          <p className="mt-1 break-words text-white/60">{usuario?.email}</p>

          <div className="mt-6 rounded-[1rem] bg-white/10 p-4">
            <p className="text-sm text-white/60">Perfil</p>
            <p className="mt-1 font-bold capitalize">{usuario?.papel}</p>
          </div>

          <div className="mt-6 space-y-3">
            {usuario?.papel === "aluno" && (
              <>
                <InfoItem
                  icon={<Layers3 size={18} />}
                  text="Projetos vinculados"
                />
                <InfoItem
                  icon={<Clock size={18} />}
                  text="Horários disponíveis"
                />
                <InfoItem
                  icon={<CalendarCheck size={18} />}
                  text="Agendamento pelo aluno"
                />
              </>
            )}

            {usuario?.papel === "professor" && (
              <>
                <InfoItem
                  icon={<Clock size={18} />}
                  text="Disponibilidades cadastradas"
                />
                <InfoItem
                  icon={<CalendarCheck size={18} />}
                  text="Agenda do professor"
                />
              </>
            )}

            {(usuario?.papel === "admin" ||
              usuario?.papel === "coordenador") && (
              <>
                <InfoItem
                  icon={<GraduationCap size={18} />}
                  text="Agenda geral"
                />
                <InfoItem
                  icon={<Layers3 size={18} />}
                  text="Projetos pendentes"
                />
                <Link
                  href="/dashboard"
                  className="mt-4 block rounded-full bg-white px-5 py-3 text-center font-bold text-[#2F39E0]"
                >
                  Ir para dashboard
                </Link>
              </>
            )}
          </div>
        </aside>

        <section className="space-y-6">
          {erro && (
            <div className="rounded-[1rem] border border-red-300/25 bg-red-300/10 p-4 text-red-100">
              {erro}
            </div>
          )}

          {mensagem && (
            <div className="rounded-[1rem] border border-white/15 bg-white/10 p-4 text-white/80">
              {mensagem}
            </div>
          )}

          {usuario?.papel === "aluno" && (
            <form
              onSubmit={realizarAgendamento}
              className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
            >
              <div className="mb-6">
                <p className="text-sm uppercase tracking-[0.25em] text-white/50">
                  Novo agendamento
                </p>
                <h2 className="mt-2 text-2xl font-black">
                  Escolha um horário disponível
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Campo label="Data">
                  <input
                    value={dataSelecionada}
                    onChange={(event) => setDataSelecionada(event.target.value)}
                    className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                    type="date"
                  />
                </Campo>

                <Campo label="Professor">
                  <select
                    value={professorSelecionado}
                    onChange={(event) =>
                      setProfessorSelecionado(event.target.value)
                    }
                    className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                  >
                    {professoresDoProjetoSelecionado.map((professor) => (
                      <option
                        key={professor.professor_id}
                        value={professor.professor_id}
                      >
                        {professor.professor_nome}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo label="Projeto">
                  <select
                    value={projetoSelecionado}
                    onChange={(event) => {
                      const novoProjetoId = event.target.value;
                      const novoProjeto = projetos.find(
                        (projeto) => projeto.id === Number(novoProjetoId)
                      );
                      setProjetoSelecionado(novoProjetoId);
                      setProfessorSelecionado(
                        novoProjeto?.professores[0]?.professor_id
                          ? String(novoProjeto.professores[0].professor_id)
                          : ""
                      );
                      setHorarios([]);
                      setHorarioSelecionado("");
                    }}
                    className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                  >
                    {projetos.map((projeto) => (
                      <option key={projeto.id} value={projeto.id}>
                        {projeto.nome}
                      </option>
                    ))}
                  </select>
                </Campo>

                <Campo label="Horário">
                  <select
                    value={horarioSelecionado}
                    onChange={(event) =>
                      setHorarioSelecionado(event.target.value)
                    }
                    className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
                  >
                    <option value="">Buscar horários</option>
                    {horarios.map((horario) => (
                      <option
                        key={horario.data_hora_inicio}
                        value={horario.data_hora_inicio}
                      >
                        {formatarHora(horario.data_hora_inicio)} -{" "}
                        {formatarHora(horario.data_hora_fim)}
                      </option>
                    ))}
                  </select>
                </Campo>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={buscarHorarios}
                  disabled={buscandoHorarios || !professorSelecionado}
                  className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Search size={18} />
                  {buscandoHorarios ? "Buscando..." : "Buscar horários"}
                </button>

                <button
                  disabled={agendando || !horarioSelecionado}
                  className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CalendarCheck size={18} />
                  {agendando ? "Agendando..." : "Confirmar agendamento"}
                </button>
              </div>
            </form>
          )}

          <div>
            <div className="mb-5">
              <p className="text-sm uppercase tracking-[0.3em] text-white/50">
                Agenda
              </p>
              <h2 className="mt-2 text-3xl font-black">
                Reuniões registradas
              </h2>
            </div>

            <div className="grid gap-4">
              {proximasReunioes.map((reuniao) => (
                <div
                  key={reuniao.reuniao_id}
                  className="grid gap-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                >
                  <div>
                    <p className="text-sm text-white/60">Projeto</p>
                    <h3 className="mt-1 text-xl font-bold">
                      {reuniao.projeto_nome ?? "Projeto acadêmico"}
                    </h3>
                    <p className="mt-2 text-sm text-white/55">
                      {formatarDataHora(reuniao.data_hora_inicio)} até{" "}
                      {formatarHora(reuniao.data_hora_fim)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Aluno</p>
                    <p className="mt-1 font-medium">
                      {reuniao.aluno_nome ?? "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Professor</p>
                    <p className="mt-1 font-medium">
                      {reuniao.professor_nome ?? "Não informado"}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]">
                      {reuniao.status}
                    </span>
                  </div>
                </div>
              ))}

              {proximasReunioes.length === 0 && (
                <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-8 text-white/70">
                  Nenhum agendamento encontrado.
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function tituloPorPapel(papel?: string) {
  if (papel === "aluno") return "Área de agendamento do aluno";
  if (papel === "professor") return "Agenda do professor";
  if (papel === "coordenador") return "Gestão de agendamentos";
  if (papel === "admin") return "Gestão administrativa";
  return "Agendamentos";
}

function formatarDataHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function formatarHora(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-white/65">{label}</span>
      {children}
    </label>
  );
}

function InfoItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1rem] bg-white/10 p-4 text-sm text-white/80">
      {icon}
      {text}
    </div>
  );
}
