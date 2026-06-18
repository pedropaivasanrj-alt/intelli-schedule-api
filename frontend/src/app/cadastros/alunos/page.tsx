"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { Aluno } from "@/lib/types";

export default function AlunosCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    matricula: "",
    curso: "",
  });
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

    carregarAlunos();
  }, [usuario]);

  async function carregarAlunos() {
    setAlunos(await apiFetch<Aluno[]>("/api/v1/alunos/"));
  }

  async function criarAluno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await apiFetch<Aluno>("/api/v1/alunos/", {
        method: "POST",
        body: JSON.stringify({ ...form, ativo: true }),
      });
      setForm({ nome: "", email: "", matricula: "", curso: "" });
      setMensagem("Aluno cadastrado.");
      carregarAlunos();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao cadastrar");
    }
  }

  async function alternarAluno(aluno: Aluno) {
    await apiFetch<Aluno>(`/api/v1/alunos/${aluno.id}/ativo`, {
      method: "PATCH",
      body: JSON.stringify({ ativo: !aluno.ativo }),
    });
    carregarAlunos();
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <Header titulo="Alunos" />
      <section className="mx-auto max-w-7xl space-y-6">
        {erro && <Aviso texto={erro} tipo="erro" />}
        {mensagem && <Aviso texto={mensagem} />}
        <form
          onSubmit={criarAluno}
          className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
        >
          <h2 className="mb-5 text-2xl font-black">Novo aluno</h2>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_1fr_auto]">
            <Input
              placeholder="Nome"
              value={form.nome}
              onChange={(nome) => setForm((atual) => ({ ...atual, nome }))}
            />
            <Input
              placeholder="E-mail"
              type="email"
              value={form.email}
              onChange={(email) => setForm((atual) => ({ ...atual, email }))}
            />
            <Input
              placeholder="Matrícula"
              value={form.matricula}
              onChange={(matricula) =>
                setForm((atual) => ({ ...atual, matricula }))
              }
            />
            <Input
              placeholder="Curso"
              value={form.curso}
              onChange={(curso) => setForm((atual) => ({ ...atual, curso }))}
            />
            <button className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
              <Plus size={18} />
              Cadastrar
            </button>
          </div>
        </form>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alunos.map((aluno) => (
            <div
              key={aluno.id}
              className="rounded-[1.3rem] border border-white/10 bg-white/10 p-5"
            >
              <p className="text-xl font-black">{aluno.nome}</p>
              <p className="mt-1 text-sm text-white/60">{aluno.email}</p>
              <p className="mt-1 text-sm text-white/50">
                {aluno.curso ?? "Curso não informado"}
              </p>
              <button
                onClick={() => alternarAluno(aluno)}
                className="mt-5 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold"
              >
                {aluno.ativo ? (
                  <ToggleRight size={18} />
                ) : (
                  <ToggleLeft size={18} />
                )}
                {aluno.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>
          ))}
        </div>
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
  type = "text",
  onChange,
}: {
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <input
      required
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      type={type}
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
