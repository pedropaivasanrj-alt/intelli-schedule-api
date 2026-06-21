"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, UserRound } from "lucide-react";
import { obterUsuario } from "@/lib/auth";

export default function AcessoNegadoPage() {
  const router = useRouter();
  const usuario = obterUsuario();
  const [origem, setOrigem] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrigem(params.get("from"));
  }, []);

  return (
    <main className="min-h-screen bg-[#08112B] px-6 py-12 text-white md:px-14 lg:px-20">
      <section className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
          <LockKeyhole size={30} />
        </div>

        <p className="text-sm uppercase tracking-[0.3em] text-white/50">
          Acesso negado
        </p>
        <h1 className="mt-3 text-4xl font-black md:text-6xl">
          Seu perfil não tem permissão para esta área.
        </h1>

        <div className="mt-8 rounded-[1.3rem] border border-white/10 bg-white/10 p-5">
          <div className="flex items-center gap-3">
            <UserRound className="text-white/70" />
            <div>
              <p className="font-bold">{usuario?.nome ?? "Usuário não identificado"}</p>
              <p className="text-sm capitalize text-white/60">
                Perfil: {usuario?.papel ?? "sem perfil"}
              </p>
            </div>
          </div>
          {origem && (
            <p className="mt-4 break-words text-sm text-white/50">
              Tentativa de acesso: {origem}
            </p>
          )}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 font-bold transition hover:bg-white/15"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <Link
            href="/projetos"
            className="rounded-full bg-white px-6 py-3 text-center font-bold text-[#2F39E0]"
          >
            Ir para projetos
          </Link>

          <Link
            href="/perfil"
            className="rounded-full border border-white/15 bg-white/10 px-6 py-3 text-center font-bold transition hover:bg-white/15"
          >
            Ver meu perfil
          </Link>
        </div>
      </section>
    </main>
  );
}
