"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, LayoutDashboard, LogOut, UserRound, UsersRound } from "lucide-react";
import { obterUsuario, sair, UsuarioAutenticado } from "@/lib/auth";

const rotasSemNavegacao = ["/login"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);

  useEffect(() => {
    setUsuario(obterUsuario());
  }, [pathname]);

  const esconderNavegacao = rotasSemNavegacao.some((rota) =>
    pathname?.startsWith(rota)
  );

  if (esconderNavegacao) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08112B]/85 px-4 py-3 text-white backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold transition hover:bg-white/15"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <Link className="nav-pill" href="/projetos">
              <CalendarCheck size={16} />
              Projetos
            </Link>

            <Link className="nav-pill" href="/agendamentos">
              <CalendarCheck size={16} />
              Agendamentos
            </Link>

            {(usuario?.papel === "admin" || usuario?.papel === "coordenador") && (
              <>
                <Link className="nav-pill" href="/dashboard">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <Link className="nav-pill" href="/cadastros">
                  <UsersRound size={16} />
                  Cadastros
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/perfil"
              className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm transition hover:bg-white/15"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#2F39E0]">
                <UserRound size={16} />
              </span>
              <span className="leading-tight">
                <span className="block font-bold">{usuario?.nome ?? "Visitante"}</span>
                <span className="block text-xs capitalize text-white/60">
                  {usuario?.papel ?? "sem perfil"}
                </span>
              </span>
            </Link>

            {usuario && (
              <button
                type="button"
                onClick={sair}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0] transition hover:scale-[1.02]"
              >
                <LogOut size={16} />
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      {children}
    </>
  );
}
