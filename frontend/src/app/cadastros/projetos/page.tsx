"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  GraduationCap,
  LogOut,
  Plus,
  Search,
  UserRound,
  X,
} from "lucide-react";
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

type ProjetoProfessor = {
  professor_id: number;
  professor_nome?: string;
  professor_email?: string;
  papel_no_projeto?: string;
};

type Projeto = {
  id: number;
  nome: string;
  resumo?: string | null;
  caracteristicas?: string | null;
  objetivo?: string | null;
  descricao_foco?: string | null;
  alunos_envolvidos?: string | null;
  status: string;
  professores?: ProjetoProfessor[];
};

const formInicial = {
  nome: "",
  resumo: "",
  caracteristicas: "",
  objetivo: "",
  descricao_foco: "",
  status: "Ativo",
};

export default function ProjetosCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);

  const [alunosSelecionados, setAlunosSelecionados] = useState<Aluno[]>([]);
  const [orientadorSelecionado, setOrientadorSelecionado] =
    useState<Professor | null>(null);

  const [buscaAluno, setBuscaAluno] = useState("");
  const [buscaProfessor, setBuscaProfessor] = useState("");

  const [form, setForm] = useState(formInicial);
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
      window.location.replace("/projetos");
      return;
    }

    carregarDados();
  }, [usuario]);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      const [alunosApi, professoresApi, projetosApi] = await Promise.all([
        apiFetch<Aluno[]>("/api/v1/alunos/"),
        apiFetch<Professor[]>("/api/v1/professores/"),
        apiFetch<Projeto[]>("/api/v1/projetos/"),
      ]);

      const alunosAtivos = alunosApi.filter((aluno) => aluno.ativo);
      const professoresAtivos = professoresApi.filter(
        (professor) => professor.ativo
      );

      setAlunos(alunosAtivos);
      setProfessores(professoresAtivos);
      setProjetos(projetosApi);

      if (!orientadorSelecionado && professoresAtivos.length > 0) {
        setOrientadorSelecionado(professoresAtivos[0]);
      }
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os dados"
      );
    } finally {
      setCarregando(false);
    }
  }

  const alunosFiltrados = useMemo(() => {
    const texto = buscaAluno.trim().toLowerCase();

    return alunos
      .filter(
        (aluno) =>
          !alunosSelecionados.some(
            (selecionado) => selecionado.id === aluno.id
          )
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
  }, [alunos, alunosSelecionados, buscaAluno]);

  const professoresFiltrados = useMemo(() => {
    const texto = buscaProfessor.trim().toLowerCase();

    return professores.filter((professor) => {
      if (!texto) return true;

      const campos = [
        professor.nome,
        professor.email,
        professor.departamento ?? "",
      ];

      return campos.some((campo) => campo.toLowerCase().includes(texto));
    });
  }, [professores, buscaProfessor]);

  function adicionarAluno(aluno: Aluno) {
    const jaSelecionado = alunosSelecionados.some(
      (selecionado) => selecionado.id === aluno.id
    );

    if (jaSelecionado) return;

    setAlunosSelecionados([...alunosSelecionados, aluno]);
  }

  function removerAluno(alunoId: number) {
    setAlunosSelecionados(
      alunosSelecionados.filter((aluno) => aluno.id !== alunoId)
    );
  }

  async function criarProjeto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErro("");
    setMensagem("");

    if (alunosSelecionados.length === 0) {
      setErro("Selecione pelo menos um aluno ativo para o projeto.");
      return;
    }

    if (!orientadorSelecionado) {
      setErro("Selecione um professor/orientador ativo para o projeto.");
      return;
    }

    setSalvando(true);

    try {
      const projetoCriado = await apiFetch<Projeto>("/api/v1/projetos/", {
        method: "POST",
        body: JSON.stringify({
          nome: form.nome,
          resumo: form.resumo,
          caracteristicas: form.caracteristicas,
          objetivo: form.objetivo,
          descricao_foco: form.descricao_foco,
          status: form.status,
          alunos_envolvidos: alunosSelecionados
            .map((aluno) => aluno.nome)
            .join(", "),
          orientador_id: orientadorSelecionado.id,
        }),
      });

      await Promise.all(
        alunosSelecionados.map((aluno) =>
          apiFetch(`/api/v1/projetos/${projetoCriado.id}/alunos/${aluno.id}`, {
            method: "POST",
          })
        )
      );

      setForm(formInicial);
      setAlunosSelecionados([]);
      setBuscaAluno("");
      setBuscaProfessor("");
      setOrientadorSelecionado(professores[0] ?? null);

      setMensagem("Projeto cadastrado com orientador e alunos vinculados.");

      await carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível criar projeto"
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
        Carregando cadastro de projetos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <Header titulo="Projetos" />

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[560px_1fr]">
        <form
          onSubmit={criarProjeto}
          className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
        >
          <h2 className="text-2xl font-black">Novo projeto</h2>

          <div className="mt-5 grid gap-3">
            <Input
              placeholder="Nome do projeto"
              value={form.nome}
              onChange={(nome) => setForm((atual) => ({ ...atual, nome }))}
            />

            <Textarea
              placeholder="Resumo obrigatório"
              value={form.resumo}
              onChange={(resumo) =>
                setForm((atual) => ({ ...atual, resumo }))
              }
            />

            <Textarea
              placeholder="Características obrigatórias"
              value={form.caracteristicas}
              onChange={(caracteristicas) =>
                setForm((atual) => ({ ...atual, caracteristicas }))
              }
            />

            <Textarea
              placeholder="Objetivo principal"
              value={form.objetivo}
              onChange={(objetivo) =>
                setForm((atual) => ({ ...atual, objetivo }))
              }
            />

            <Input
              placeholder="Foco da avaliação"
              value={form.descricao_foco}
              onChange={(descricao_foco) =>
                setForm((atual) => ({ ...atual, descricao_foco }))
              }
            />

            <section className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 font-bold">
                <UserRound size={18} />
                Alunos ativos
              </div>

              <div className="flex items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3">
                <Search size={18} className="text-white/45" />

                <input
                  value={buscaAluno}
                  onChange={(event) => setBuscaAluno(event.target.value)}
                  placeholder="Buscar aluno por nome, e-mail, matrícula ou curso..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="mt-3 max-h-52 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  {alunosFiltrados.map((aluno) => (
                    <button
                      key={aluno.id}
                      type="button"
                      onClick={() => adicionarAluno(aluno)}
                      className="rounded-xl border border-white/10 bg-white/10 p-3 text-left transition hover:bg-white/15"
                    >
                      <strong>{aluno.nome}</strong>

                      <p className="text-sm text-white/60">{aluno.email}</p>

                      <p className="text-xs text-white/40">
                        {aluno.matricula ?? "Sem matrícula"} •{" "}
                        {aluno.curso ?? "Sem curso"}
                      </p>
                    </button>
                  ))}

                  {alunosFiltrados.length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white/55">
                      Nenhum aluno ativo encontrado.
                    </p>
                  )}
                </div>
              </div>

              {alunosSelecionados.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-bold text-white/70">
                    Alunos selecionados
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {alunosSelecionados.map((aluno) => (
                      <button
                        key={aluno.id}
                        type="button"
                        onClick={() => removerAluno(aluno.id)}
                        className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]"
                      >
                        {aluno.nome}
                        <X size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 font-bold">
                <GraduationCap size={18} />
                Professor/orientador ativo
              </div>

              <div className="flex items-center gap-3 rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3">
                <Search size={18} className="text-white/45" />

                <input
                  value={buscaProfessor}
                  onChange={(event) => setBuscaProfessor(event.target.value)}
                  placeholder="Buscar professor por nome, e-mail ou departamento..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>

              <div className="mt-3 max-h-52 overflow-y-auto pr-1">
                <div className="grid gap-2">
                  {professoresFiltrados.map((professor) => {
                    const selecionado =
                      orientadorSelecionado?.id === professor.id;

                    return (
                      <button
                        key={professor.id}
                        type="button"
                        onClick={() => setOrientadorSelecionado(professor)}
                        className={`rounded-xl border p-3 text-left transition ${
                          selecionado
                            ? "border-emerald-300/30 bg-emerald-300/10"
                            : "border-white/10 bg-white/10 hover:bg-white/15"
                        }`}
                      >
                        <strong>{professor.nome}</strong>

                        <p className="text-sm text-white/60">
                          {professor.email}
                        </p>

                        <p className="text-xs text-white/40">
                          {professor.departamento ?? "Sem departamento"}
                        </p>
                      </button>
                    );
                  })}

                  {professoresFiltrados.length === 0 && (
                    <p className="rounded-xl border border-white/10 bg-white/10 p-3 text-sm text-white/55">
                      Nenhum professor ativo encontrado.
                    </p>
                  )}
                </div>
              </div>

              {orientadorSelecionado && (
                <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-100">
                  <strong>Orientador selecionado:</strong>
                  <br />
                  {orientadorSelecionado.nome} — {orientadorSelecionado.email}
                </div>
              )}
            </section>

            {erro && <Aviso tipo="erro" texto={erro} />}
            {mensagem && <Aviso texto={mensagem} />}

            <button
              disabled={salvando}
              className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={18} />
              {salvando ? "Criando..." : "Criar projeto"}
            </button>
          </div>
        </form>

        <section className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
            <h2 className="text-2xl font-black">Projetos cadastrados</h2>
          </div>

          <div className="grid gap-3">
            {projetos.map((projeto) => (
              <a
                key={projeto.id}
                href={`/projetos/${projeto.id}`}
                className="rounded-[1.3rem] border border-white/10 bg-white/10 p-5 transition hover:bg-white/15"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xl font-black">{projeto.nome}</p>

                    <p className="mt-2 line-clamp-2 text-sm text-white/65">
                      {projeto.resumo}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {projeto.professores?.map((professor) => (
                        <span
                          key={professor.professor_id}
                          className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/70"
                        >
                          {professor.professor_nome}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]">
                    {projeto.status}
                  </span>
                </div>
              </a>
            ))}

            {projetos.length === 0 && (
              <div className="rounded-[1.3rem] border border-white/10 bg-white/10 p-5 text-white/60">
                Nenhum projeto cadastrado.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function Header({ titulo }: { titulo: string }) {
  return (
    <nav className="mx-auto mb-10 flex max-w-7xl items-center justify-between">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Cadastros
        </p>

        <h1 className="mt-2 text-3xl font-black md:text-5xl">{titulo}</h1>
      </div>

      <button
        onClick={sair}
        className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold"
      >
        <LogOut size={17} />
        Sair
      </button>
    </nav>
  );
}

function Input({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
    />
  );
}

function Textarea({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <textarea
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none placeholder:text-white/35"
    />
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