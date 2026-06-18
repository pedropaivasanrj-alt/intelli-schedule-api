"use client";

import { FormEvent, useEffect, useState } from "react";
import { LogOut, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { Professor } from "@/lib/types";

type Disponibilidade = {
  id: number;
  professor_id: number;
  data: string;
  hora_inicio: string;
  hora_fim: string;
};

export default function DisponibilidadesCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>(
    []
  );
  const [form, setForm] = useState({
    professor_id: "",
    data: "2026-06-21",
    hora_inicio: "08:00",
    hora_fim: "12:00",
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

    carregarDados();
  }, [usuario]);

  async function carregarDados() {
    const [professoresApi, disponibilidadesApi] = await Promise.all([
      apiFetch<Professor[]>("/api/v1/professores/"),
      apiFetch<Disponibilidade[]>("/api/v1/disponibilidades/"),
    ]);
    setProfessores(professoresApi);
    setDisponibilidades(disponibilidadesApi);
    setForm((atual) => ({
      ...atual,
      professor_id: atual.professor_id
        ? atual.professor_id
        : professoresApi[0]
          ? String(professoresApi[0].id)
          : "",
    }));
  }

  async function criarDisponibilidade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await apiFetch<Disponibilidade>("/api/v1/disponibilidades/", {
        method: "POST",
        body: JSON.stringify({
          professor_id: Number(form.professor_id),
          data: form.data,
          hora_inicio: form.hora_inicio,
          hora_fim: form.hora_fim,
        }),
      });
      setMensagem("Disponibilidade cadastrada.");
      carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar disponibilidade"
      );
    }
  }

  function nomeProfessor(professorId: number) {
    return (
      professores.find((professor) => professor.id === professorId)?.nome ??
      "Professor"
    );
  }

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-10 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Cadastros
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Disponibilidades
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

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={criarDisponibilidade}
          className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
        >
          <h2 className="text-2xl font-black">Nova disponibilidade</h2>
          <div className="mt-5 grid gap-3">
            <select
              required
              value={form.professor_id}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  professor_id: event.target.value,
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
            <input
              required
              type="date"
              value={form.data}
              onChange={(event) =>
                setForm((atual) => ({ ...atual, data: event.target.value }))
              }
              className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
            />
            <input
              required
              type="time"
              value={form.hora_inicio}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  hora_inicio: event.target.value,
                }))
              }
              className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
            />
            <input
              required
              type="time"
              value={form.hora_fim}
              onChange={(event) =>
                setForm((atual) => ({
                  ...atual,
                  hora_fim: event.target.value,
                }))
              }
              className="w-full rounded-[0.9rem] border border-white/10 bg-white/10 px-4 py-3 text-white outline-none"
            />
            <button className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
              <Plus size={18} />
              Cadastrar
            </button>
          </div>
        </form>

        <section className="space-y-4">
          {erro && <Aviso tipo="erro" texto={erro} />}
          {mensagem && <Aviso texto={mensagem} />}
          <div className="grid gap-3 md:grid-cols-2">
            {disponibilidades.map((item) => (
              <div
                key={item.id}
                className="rounded-[1.3rem] border border-white/10 bg-white/10 p-5"
              >
                <p className="text-xl font-black">
                  {nomeProfessor(item.professor_id)}
                </p>
                <p className="mt-2 text-white/65">
                  {item.data} · {item.hora_inicio} às {item.hora_fim}
                </p>
              </div>
            ))}
          </div>
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
          : "border-white/15 bg-white/10 text-white/80"
      }`}
    >
      {texto}
    </div>
  );
}
