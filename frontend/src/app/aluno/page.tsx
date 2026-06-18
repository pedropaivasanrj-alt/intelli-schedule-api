"use client";

import { useEffect } from "react";

export default function AlunoPage() {
  useEffect(() => {
    window.location.replace("/projetos");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08112B] text-white">
      Carregando área do aluno...
    </main>
  );
}
