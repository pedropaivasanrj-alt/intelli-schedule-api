"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { LogOut, Plus, ToggleLeft, ToggleRight, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";
import { AcessoLog, UsuarioSistema } from "@/lib/types";

export default function UsuariosCadastroPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [logs, setLogs] = useState<AcessoLog[]>([]);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "123456",
  });
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    if (usuario.papel !== "admin") {
      window.location.replace("/cadastros");
      return;
    }

    carregarDados();
  }, [usuario]);

  async function carregarDados() {
    try {
      const [usuariosApi, logsApi] = await Promise.all([
        apiFetch<UsuarioSistema[]>("/api/v1/usuarios/"),
        apiFetch<AcessoLog[]>("/api/v1/usuarios/logs"),
      ]);
      setUsuarios(usuariosApi);
      setLogs(logsApi);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar dados");
    }
  }

  async function criarCoordenador(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setMensagem("");

    try {
      await apiFetch<UsuarioSistema>("/api/v1/usuarios/coordenadores", {
        method: "POST",
        body: JSON.stringify({ ...form, ativo: true }),
      });
      setForm({ nome: "", email: "", senha: "123456" });
      setMensagem("Coordenador cadastrado com sucesso.");
      carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o coordenador"
      );
    }
  }

  async function alternarUsuario(item: UsuarioSistema) {
    setErro("");
    setMensagem("");

    try {
      await apiFetch<UsuarioSistema>(`/api/v1/usuarios/${item.id}/ativo`, {
        method: "PATCH",
        body: JSON.stringify({ ativo: !item.ativo }),
      });
      setMensagem(item.ativo ? "Usuário desativado." : "Usuário ativado.");
      carregarDados();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao alterar usuário");
    }
  }

  async function removerCoordenador(item: UsuarioSistema) {
    setErro("");
    setMensagem("");

    try {
      await apiFetch(`/api/v1/usuarios/coordenadores/${item.id}`, {
        method: "DELETE",
      });
      setMensagem("Coordenador removido.");
      carregarDados();
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível remover o coordenador"
      );
    }
  }

  const coordenadores = useMemo(
    () => usuarios.filter((item) => item.papel === "coordenador"),
    [usuarios]
  );

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <Header titulo="Controle de acessos" />

      <section className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
        <form
          onSubmit={criarCoordenador}
          className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6"
        >
          <h2 className="text-2xl font-black">Novo coordenador</h2>
          <div className="mt-5 grid gap-3">
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
              placeholder="Senha"
              value={form.senha}
              onChange={(senha) => setForm((atual) => ({ ...atual, senha }))}
            />
            <button className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
              <Plus size={18} />
              Adicionar coordenador
            </button>
          </div>
        </form>

        <section className="space-y-5">
          {erro && <Aviso tipo="erro" texto={erro} />}
          {mensagem && <Aviso texto={mensagem} />}

          <ListaUsuarios
            titulo="Usuários do sistema"
            usuarios={usuarios}
            onToggle={alternarUsuario}
          />

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
            <h2 className="mb-4 text-2xl font-black">Coordenadores</h2>
            <div className="grid gap-3">
              {coordenadores.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-[1rem] bg-white/10 p-4"
                >
                  <div>
                    <p className="font-bold">{item.nome}</p>
                    <p className="text-sm text-white/60">{item.email}</p>
                  </div>
                  <button
                    onClick={() => removerCoordenador(item)}
                    className="flex items-center gap-2 rounded-full border border-red-300/25 px-4 py-2 text-sm font-bold text-red-100"
                  >
                    <Trash2 size={16} />
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
            <h2 className="mb-4 text-2xl font-black">Logs recentes</h2>
            <div className="grid gap-3">
              {logs.slice(0, 12).map((log) => (
                <div key={log.id} className="rounded-[1rem] bg-white/10 p-4">
                  <p className="font-bold">
                    {log.usuario_email ?? "Sistema"}: {log.acao} em{" "}
                    {log.recurso}
                  </p>
                  <p className="text-sm text-white/60">
                    {log.detalhes ?? "Sem detalhes"}
                  </p>
                </div>
              ))}
            </div>
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

function ListaUsuarios({
  titulo,
  usuarios,
  onToggle,
}: {
  titulo: string;
  usuarios: UsuarioSistema[];
  onToggle: (usuario: UsuarioSistema) => void;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/10 p-6">
      <h2 className="mb-4 text-2xl font-black">{titulo}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {usuarios.map((item) => (
          <div key={item.id} className="rounded-[1rem] bg-white/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold">{item.nome}</p>
                <p className="text-sm text-white/60">{item.email}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">
                  {item.papel}
                </p>
              </div>
              <button
                onClick={() => onToggle(item)}
                className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold"
              >
                {item.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                {item.ativo ? "Ativo" : "Inativo"}
              </button>
            </div>
          </div>
        ))}
      </div>
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
