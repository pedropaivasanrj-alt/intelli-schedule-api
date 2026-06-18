"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { Professor, Projeto } from "@/lib/types";

const formInicial = {
  nome: "",
  resumo: "",
  caracteristicas: "",
  objetivo: "",
  descricao_foco: "",
  alunos_envolvidos: "",
  status: "Ativo",
  orientador_id: "",
};

export default function ProjetosCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [form, setForm] = useState(formInicial);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

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
    const [professoresApi, projetosApi] = await Promise.all([
      apiFetch<Professor[]>("/api/v1/professores/"),
      apiFetch<Projeto[]>("/api/v1/projetos/"),
    ]);
    setProfessores(professoresApi.filter((professor) => professor.ativo));
    setProjetos(projetosApi);
    setForm((atual) => ({
      ...atual,
      orientador_id: atual.orientador_id
        ? atual.orientador_id
        : professoresApi[0]
          ? String(professoresApi[0].id)
          : "",
    }));
  }

  async function criarProjeto(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await apiFetch<Projeto>("/api/v1/projetos/", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          orientador_id: Number(form.orientador_id),
        }),
      });
      setForm({
        ...formInicial,
        orientador_id: professores[0] ? String(professores[0].id) : "",
      });
      setMensagem("Projeto cadastrado com orientador.");
      carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível criar projeto"
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <Header titulo="Projetos" />
      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[520px_1fr]">
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
              placeholder="Alunos envolvidos"
              value={form.alunos_envolvidos}
              onChange={(alunos_envolvidos) =>
                setForm((atual) => ({ ...atual, alunos_envolvidos }))
              }
            />
            <Input
              placeholder="Foco da avaliação"
              value={form.descricao_foco}
              onChange={(descricao_foco) =>
                setForm((atual) => ({ ...atual, descricao_foco }))
              }
            />
            <select
              required
              value={form.orientador_id}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  orientador_id: event.target.value,
                }))
              }
              className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
            >
              {professores.map((professor) => (
                <option key={professor.id} value={professor.id}>
                  {professor.nome}
                </option>
              ))}
            </select>
            <button className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
              <Plus size={18} />
              Criar projeto
            </button>
          </div>
        </form>

        <section className="space-y-5">
          {erro && <Aviso tipo="erro" texto={erro} />}
          {mensagem && <Aviso texto={mensagem} />}
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
                  </div>
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]">
                    {projeto.status}
                  </span>
                </div>
              </a>
            ))}
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
          : "border-white/15 bg-white/10 text-white/80"
      }`}
    >
      {texto}
    </div>
  );
}
