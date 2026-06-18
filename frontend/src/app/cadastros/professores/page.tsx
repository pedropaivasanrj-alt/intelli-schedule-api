"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { Professor } from "@/lib/types";

export default function ProfessoresCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [form, setForm] = useState({ nome: "", email: "", departamento: "" });
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

    carregarProfessores();
  }, [usuario]);

  async function carregarProfessores() {
    setProfessores(await apiFetch<Professor[]>("/api/v1/professores/"));
  }

  async function criarProfessor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await apiFetch<Professor>("/api/v1/professores/", {
        method: "POST",
        body: JSON.stringify({ ...form, ativo: true }),
      });
      setForm({ nome: "", email: "", departamento: "" });
      setMensagem("Professor cadastrado.");
      carregarProfessores();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao cadastrar");
    }
  }

  async function alternarProfessor(professor: Professor) {
    await apiFetch<Professor>(`/api/v1/professores/${professor.id}/ativo`, {
      method: "PATCH",
      body: JSON.stringify({ ativo: !professor.ativo }),
    });
    carregarProfessores();
  }

  return (
    <CadastroShell titulo="Professores">
      {erro && <Aviso texto={erro} tipo="erro" />}
      {mensagem && <Aviso texto={mensagem} />}
      <form
        onSubmit={criarProfessor}
        className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
      >
        <h2 className="mb-5 text-2xl font-black">Novo professor</h2>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
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
            placeholder="Departamento"
            value={form.departamento}
            onChange={(departamento) =>
              setForm((atual) => ({ ...atual, departamento }))
            }
          />
          <button className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
            <Plus size={18} />
            Cadastrar
          </button>
        </div>
      </form>
      <ListaAtivos
        itens={professores}
        subtitulo={(professor) => professor.departamento || professor.email}
        onToggle={alternarProfessor}
      />
    </CadastroShell>
  );
}

function CadastroShell({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
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
      <section className="mx-auto max-w-7xl space-y-6">{children}</section>
    </main>
  );
}

function ListaAtivos<T extends { id: number; nome: string; ativo: boolean }>({
  itens,
  subtitulo,
  onToggle,
}: {
  itens: T[];
  subtitulo: (item: T) => string;
  onToggle: (item: T) => void;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {itens.map((item) => (
        <div
          key={item.id}
          className="rounded-[1.3rem] border border-white/10 bg-white/10 p-5"
        >
          <p className="text-xl font-black">{item.nome}</p>
          <p className="mt-1 text-sm text-white/60">{subtitulo(item)}</p>
          <button
            onClick={() => onToggle(item)}
            className="mt-5 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold"
          >
            {item.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            {item.ativo ? "Ativo" : "Inativo"}
          </button>
        </div>
      ))}
    </div>
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
