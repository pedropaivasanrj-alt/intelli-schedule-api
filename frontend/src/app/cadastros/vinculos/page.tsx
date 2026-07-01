"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  GraduationCap,
  Link2,
  LogOut,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";

type Aluno = {
  id: number;
  nome: string;
  email: string;
  matricula?: string | null;
  curso?: string | null;
  ativo: boolean;
};

type Professor = {
  id: number;
  nome: string;
  email: string;
  departamento?: string | null;
  ativo: boolean;
};

type ProjetoAluno = {
  aluno_id: number;
  aluno_nome?: string;
  aluno_email?: string;
};

type ProjetoProfessor = {
  professor_id: number;
  professor_nome?: string;
  professor_email?: string;
  papel_no_projeto?: string | null;
};

type Projeto = {
  id: number;
  nome: string;
  resumo?: string | null;
  status?: string;
  alunos?: ProjetoAluno[];
  professores?: ProjetoProfessor[];
};

export default function VinculosPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());

  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);

  const [projetoId, setProjetoId] = useState("");
  const [buscaProjeto, setBuscaProjeto] = useState("");
  const [buscaAluno, setBuscaAluno] = useState("");
  const [buscaProfessor, setBuscaProfessor] = useState("");
  const [papelProfessor, setPapelProfessor] = useState("orientador");

  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    if (usuario.papel !== "admin" && usuario.papel !== "coordenador") {
      window.location.replace("/acesso-negado");
      return;
    }

    carregarDados();
  }, [usuario]);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      const [projetosApi, alunosApi, professoresApi] = await Promise.all([
        apiFetch<Projeto[]>("/api/v1/projetos/"),
        apiFetch<Aluno[]>("/api/v1/alunos/"),
        apiFetch<Professor[]>("/api/v1/professores/"),
      ]);

      setProjetos(projetosApi);
      setAlunos(alunosApi.filter((aluno) => aluno.ativo));
      setProfessores(professoresApi.filter((professor) => professor.ativo));

      if (!projetoId && projetosApi.length > 0) {
        setProjetoId(String(projetosApi[0].id));
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os vínculos"
      );
    } finally {
      setCarregando(false);
    }
  }

  const projetosFiltrados = useMemo(() => {
    const texto = buscaProjeto.trim().toLowerCase();

    if (!texto) return projetos;

    return projetos.filter((projeto) => {
      return (
        projeto.nome.toLowerCase().includes(texto) ||
        projeto.resumo?.toLowerCase().includes(texto)
      );
    });
  }, [projetos, buscaProjeto]);

  const projetoSelecionado = useMemo(() => {
    return projetos.find((projeto) => String(projeto.id) === projetoId) ?? null;
  }, [projetos, projetoId]);

  const alunosVinculados = projetoSelecionado?.alunos ?? [];
  const professoresVinculados = projetoSelecionado?.professores ?? [];

  const alunosDisponiveis = useMemo(() => {
    const texto = buscaAluno.trim().toLowerCase();

    return alunos
      .filter(
        (aluno) =>
          !alunosVinculados.some((vinculo) => vinculo.aluno_id === aluno.id)
      )
      .filter((aluno) => {
        if (!texto) return true;

        const campos = [
          aluno.nome,
          aluno.email,
          aluno.matricula ?? "",
          aluno.curso ?? "",
        ];

        return campos.some((campo) => campo.toLowerCase().includes(texto));
      });
  }, [alunos, alunosVinculados, buscaAluno]);

  const professoresDisponiveis = useMemo(() => {
    const texto = buscaProfessor.trim().toLowerCase();

    return professores
      .filter(
        (professor) =>
          !professoresVinculados.some(
            (vinculo) => vinculo.professor_id === professor.id
          )
      )
      .filter((professor) => {
        if (!texto) return true;

        const campos = [
          professor.nome,
          professor.email,
          professor.departamento ?? "",
        ];

        return campos.some((campo) => campo.toLowerCase().includes(texto));
      });
  }, [professores, professoresVinculados, buscaProfessor]);

  async function vincularAluno(alunoId: number) {
    if (!projetoSelecionado) return;

    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      await apiFetch(
        `/api/v1/projetos/${projetoSelecionado.id}/alunos/${alunoId}`,
        {
          method: "POST",
        }
      );

      setMensagem("Aluno vinculado ao projeto.");
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível vincular aluno"
      );
    } finally {
      setSalvando(false);
    }
  }

  async function removerAluno(alunoId: number) {
    if (!projetoSelecionado) return;

    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      await apiFetch(
        `/api/v1/projetos/${projetoSelecionado.id}/alunos/${alunoId}`,
        {
          method: "DELETE",
        }
      );

      setMensagem("Aluno removido do projeto.");
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível remover aluno"
      );
    } finally {
      setSalvando(false);
    }
  }

  async function vincularProfessor(professorId: number) {
    if (!projetoSelecionado) return;

    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      await apiFetch(
        `/api/v1/projetos/${projetoSelecionado.id}/professores/${professorId}`,
        {
          method: "POST",
          body: JSON.stringify({
            papel_no_projeto: papelProfessor,
          }),
        }
      );

      setMensagem("Professor vinculado ao projeto.");
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível vincular professor"
      );
    } finally {
      setSalvando(false);
    }
  }

  async function removerProfessor(vinculo: ProjetoProfessor) {
    if (!projetoSelecionado) return;

    const orientadores = professoresVinculados.filter(
      (professor) => professor.papel_no_projeto === "orientador"
    );

    if (vinculo.papel_no_projeto === "orientador" && orientadores.length <= 1) {
      setErro("O projeto precisa manter pelo menos um professor orientador.");
      return;
    }

    setErro("");
    setMensagem("");
    setSalvando(true);

    try {
      await apiFetch(
        `/api/v1/projetos/${projetoSelecionado.id}/professores/${vinculo.professor_id}`,
        {
          method: "DELETE",
        }
      );

      setMensagem("Professor removido do projeto.");
      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível remover professor"
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando vínculos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-10 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Cadastros
          </p>

          <h1 className="mt-2 text-3xl font-black md:text-5xl">Vínculos</h1>

          <p className="mt-3 max-w-2xl text-white/60">
            Vincule alunos e professores ativos aos projetos cadastrados.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/cadastros"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>

          <button
            onClick={sair}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
          >
            <LogOut size={17} />
            Sair
          </button>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
        <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
            <Link2 size={26} />
          </div>

          <h2 className="text-2xl font-black">Selecionar projeto</h2>

          <div className="mt-5 flex items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3">
            <Search size={18} className="text-white/45" />

            <input
              value={buscaProjeto}
              onChange={(event) => setBuscaProjeto(event.target.value)}
              placeholder="Buscar projeto..."
              className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
            />
          </div>

          <div className="mt-4 max-h-[480px] overflow-y-auto pr-1">
            <div className="grid gap-2">
              {projetosFiltrados.map((projeto) => {
                const selecionado = String(projeto.id) === projetoId;

                return (
                  <button
                    key={projeto.id}
                    type="button"
                    onClick={() => setProjetoId(String(projeto.id))}
                    className={`rounded-xl border p-4 text-left transition ${
                      selecionado
                        ? "border-emerald-300/30 bg-emerald-300/10"
                        : "border-white/10 bg-white/10 hover:bg-white/15"
                    }`}
                  >
                    <strong>{projeto.nome}</strong>

                    <p className="mt-1 line-clamp-2 text-sm text-white/60">
                      {projeto.resumo || "Sem resumo informado."}
                    </p>

                    <div className="mt-3 flex gap-2 text-xs text-white/45">
                      <span>{projeto.alunos?.length ?? 0} aluno(s)</span>
                      <span>•</span>
                      <span>
                        {projeto.professores?.length ?? 0} professor(es)
                      </span>
                    </div>
                  </button>
                );
              })}

              {projetosFiltrados.length === 0 && (
                <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-white/60">
                  Nenhum projeto encontrado.
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="grid gap-6">
          {erro && <Aviso tipo="erro" texto={erro} />}
          {mensagem && <Aviso texto={mensagem} />}

          {projetoSelecionado ? (
            <>
              <div className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                <p className="text-sm uppercase tracking-[0.25em] text-white/45">
                  Projeto selecionado
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {projetoSelecionado.nome}
                </h2>

                <p className="mt-3 max-w-3xl leading-7 text-white/65">
                  {projetoSelecionado.resumo || "Sem resumo informado."}
                </p>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
                      <UserRound size={24} />
                    </div>

                    <div>
                      <p className="text-sm text-white/55">Alunos</p>
                      <h3 className="text-2xl font-black">
                        Vínculos de alunos
                      </h3>
                    </div>
                  </div>

                  <h4 className="mb-3 font-bold">Alunos vinculados</h4>

                  <div className="grid gap-2">
                    {alunosVinculados.map((aluno) => (
                      <div
                        key={aluno.aluno_id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 p-3"
                      >
                        <div>
                          <strong>{aluno.aluno_nome}</strong>
                          <p className="text-sm text-white/55">
                            {aluno.aluno_email}
                          </p>
                        </div>

                        <button
                          disabled={salvando}
                          onClick={() => removerAluno(aluno.aluno_id)}
                          className="rounded-full border border-red-300/20 bg-red-300/10 p-3 text-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {alunosVinculados.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-white/60">
                        Nenhum aluno vinculado ainda.
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="mb-3 font-bold">Adicionar aluno ativo</h4>

                    <div className="flex items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3">
                      <Search size={18} className="text-white/45" />

                      <input
                        value={buscaAluno}
                        onChange={(event) => setBuscaAluno(event.target.value)}
                        placeholder="Buscar aluno..."
                        className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                      />
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto pr-1">
                      <div className="grid gap-2">
                        {alunosDisponiveis.map((aluno) => (
                          <button
                            key={aluno.id}
                            type="button"
                            disabled={salvando}
                            onClick={() => vincularAluno(aluno.id)}
                            className="rounded-xl border border-white/10 bg-white/10 p-3 text-left transition hover:bg-white/15 disabled:opacity-50"
                          >
                            <strong>{aluno.nome}</strong>

                            <p className="text-sm text-white/60">
                              {aluno.email}
                            </p>

                            <p className="text-xs text-white/40">
                              {aluno.matricula ?? "Sem matrícula"} •{" "}
                              {aluno.curso ?? "Sem curso"}
                            </p>
                          </button>
                        ))}

                        {alunosDisponiveis.length === 0 && (
                          <p className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white/55">
                            Nenhum aluno ativo disponível para vínculo.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur-xl">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
                      <GraduationCap size={24} />
                    </div>

                    <div>
                      <p className="text-sm text-white/55">Professores</p>
                      <h3 className="text-2xl font-black">
                        Vínculos docentes
                      </h3>
                    </div>
                  </div>

                  <h4 className="mb-3 font-bold">Professores vinculados</h4>

                  <div className="grid gap-2">
                    {professoresVinculados.map((professor) => (
                      <div
                        key={professor.professor_id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/10 p-3"
                      >
                        <div>
                          <strong>{professor.professor_nome}</strong>

                          <p className="text-sm text-white/55">
                            {professor.professor_email}
                          </p>

                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-emerald-100/80">
                            {professor.papel_no_projeto ?? "professor"}
                          </p>
                        </div>

                        <button
                          disabled={salvando}
                          onClick={() => removerProfessor(professor)}
                          className="rounded-full border border-red-300/20 bg-red-300/10 p-3 text-red-100 disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}

                    {professoresVinculados.length === 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-white/60">
                        Nenhum professor vinculado ainda.
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <h4 className="mb-3 font-bold">
                      Adicionar professor ativo
                    </h4>

                    <select
                      value={papelProfessor}
                      onChange={(event) =>
                        setPapelProfessor(event.target.value)
                      }
                      className="mb-3 w-full rounded-[0.9rem] border border-white/10 bg-[#111A3A] px-4 py-3 text-white outline-none"
                    >
                      <option value="orientador">Orientador</option>
                      <option value="avaliador">Avaliador</option>
                      <option value="coorientador">Coorientador</option>
                    </select>

                    <div className="flex items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3">
                      <Search size={18} className="text-white/45" />

                      <input
                        value={buscaProfessor}
                        onChange={(event) =>
                          setBuscaProfessor(event.target.value)
                        }
                        placeholder="Buscar professor..."
                        className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                      />
                    </div>

                    <div className="mt-3 max-h-72 overflow-y-auto pr-1">
                      <div className="grid gap-2">
                        {professoresDisponiveis.map((professor) => (
                          <button
                            key={professor.id}
                            type="button"
                            disabled={salvando}
                            onClick={() => vincularProfessor(professor.id)}
                            className="rounded-xl border border-white/10 bg-white/10 p-3 text-left transition hover:bg-white/15 disabled:opacity-50"
                          >
                            <strong>{professor.nome}</strong>

                            <p className="text-sm text-white/60">
                              {professor.email}
                            </p>

                            <p className="text-xs text-white/40">
                              {professor.departamento ?? "Sem departamento"}
                            </p>
                          </button>
                        ))}

                        {professoresDisponiveis.length === 0 && (
                          <p className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white/55">
                            Nenhum professor ativo disponível para vínculo.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </>
          ) : (
            <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-white/65">
              Selecione um projeto para gerenciar vínculos.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Aviso({ texto, tipo }: { texto: string; tipo?: "erro" }) {
  return (
    <div
      className={`rounded-[1rem] border p-4 ${
        tipo === "erro"
          ? "border-red-300/25 bg-red-300/10 text-red-100"
          : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
      }`}
    >
      {texto}
    </div>
  );
}