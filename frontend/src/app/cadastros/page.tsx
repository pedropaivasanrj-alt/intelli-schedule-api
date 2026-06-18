"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  GraduationCap,
  Layers3,
  Link2,
  LogOut,
  ShieldCheck,
  Users,
} from "lucide-react";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";

const modulos = [
  {
    titulo: "Usuários",
    descricao: "Controle de acessos, coordenadores e logs administrativos.",
    href: "/cadastros/usuarios",
    icon: ShieldCheck,
  },
  {
    titulo: "Professores",
    descricao: "Cadastro, ativação e dados acadêmicos dos professores.",
    href: "/cadastros/professores",
    icon: GraduationCap,
  },
  {
    titulo: "Alunos",
    descricao: "Cadastro, ativação, matrícula e dados dos estudantes.",
    href: "/cadastros/alunos",
    icon: Users,
  },
  {
    titulo: "Projetos",
    descricao: "Projetos com resumo, características e orientador obrigatório.",
    href: "/cadastros/projetos",
    icon: Layers3,
  },
  {
    titulo: "Disponibilidades",
    descricao: "Janelas de horário disponíveis para reuniões acadêmicas.",
    href: "/cadastros/disponibilidades",
    icon: CalendarDays,
  },
  {
    titulo: "Vínculos",
    descricao: "Alunos, orientadores e avaliadores conectados aos projetos.",
    href: "/cadastros/projetos",
    icon: Link2,
  },
];

export default function CadastrosPage() {
  const [usuario] = useState<UsuarioAutenticado | null>(() => obterUsuario());

  useEffect(() => {
    if (!usuario) {
      window.location.replace("/login");
      return;
    }

    if (usuario.papel !== "admin" && usuario.papel !== "coordenador") {
      window.location.replace("/projetos");
    }
  }, [usuario]);

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-8 text-white md:px-14 lg:px-20">
      <nav className="mx-auto mb-12 flex max-w-7xl items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-white/50">
            Cadastros
          </p>
          <h1 className="mt-2 text-3xl font-black md:text-5xl">
            Central administrativa
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
        {modulos.map((modulo) => {
          const Icon = modulo.icon;

          return (
            <a
              key={modulo.titulo}
              href={modulo.href}
              className="group rounded-[1.5rem] border border-white/10 bg-white/10 p-6 transition hover:-translate-y-1 hover:bg-white/15"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-[1rem] bg-white text-[#2F39E0]">
                <Icon size={24} />
              </div>
              <h2 className="text-2xl font-black">{modulo.titulo}</h2>
              <p className="mt-3 min-h-[72px] leading-7 text-white/65">
                {modulo.descricao}
              </p>
              <span className="mt-6 inline-flex rounded-full bg-white px-5 py-3 font-bold text-[#2F39E0]">
                Abrir módulo
              </span>
            </a>
          );
        })}
      </section>
    </main>
  );
}
