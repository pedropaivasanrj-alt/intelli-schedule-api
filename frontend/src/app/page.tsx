"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  GraduationCap,
  Users,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Layers3,
} from "lucide-react";

type Professor = {
  id: number;
  nome: string;
  email: string;
};

type Aluno = {
  id: number;
  nome: string;
  email: string;
};

type Projeto = {
  id: number;
  nome: string;
};

type Reuniao = {
  reuniao_id?: number;
  id?: number;
  projeto_nome?: string;
  professor_nome?: string;
  aluno_nome?: string;
  data_hora_inicio?: string;
  data_hora_fim?: string;
  status?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function Home() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [agenda, setAgenda] = useState<Reuniao[]>([]);
  const [apiOnline, setApiOnline] = useState(false);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [profRes, alunosRes, projetosRes, agendaRes] =
          await Promise.all([
            fetch(`${API_URL}/api/v1/professores/`),
            fetch(`${API_URL}/api/v1/alunos/`),
            fetch(`${API_URL}/api/v1/projetos/`),
            fetch(`${API_URL}/api/v1/agendamentos/agenda`),
          ]);

        if (!profRes.ok || !alunosRes.ok || !projetosRes.ok || !agendaRes.ok) {
          throw new Error("Erro ao carregar dados da API");
        }

        setProfessores(await profRes.json());
        setAlunos(await alunosRes.json());
        setProjetos(await projetosRes.json());
        setAgenda(await agendaRes.json());
        setApiOnline(true);
      } catch {
        setApiOnline(false);
      }
    }

    carregarDados();
  }, []);

  const proximasReunioes = useMemo(() => {
    return agenda.slice(0, 3);
  }, [agenda]);

  const indicadores = [
    {
      label: "Professores",
      value: professores.length,
      icon: GraduationCap,
    },
    {
      label: "Alunos",
      value: alunos.length,
      icon: Users,
    },
    {
      label: "Projetos",
      value: projetos.length,
      icon: Layers3,
    },
    {
      label: "Agendamentos",
      value: agenda.length,
      icon: CalendarCheck,
    },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#08112B] text-white">
      <section className="relative min-h-screen px-6 py-8 md:px-14 lg:px-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(47,57,224,0.45),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(93,43,225,0.35),_transparent_30%),radial-gradient(circle_at_50%_90%,_rgba(43,167,225,0.35),_transparent_30%),linear-gradient(135deg,_#08112B_0%,_#0C1635_45%,_#101B40_100%)]" />
        <div className="absolute left-1/2 top-0 -z-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[#2F70E0]/20 blur-[120px]" />

        <nav className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#2F39E0] shadow-lg shadow-[#2F39E0]/25">
              <CalendarCheck size={23} />
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-white/60">
                Intelli
              </p>
              <h1 className="text-lg font-semibold leading-none text-white">
                Schedule
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#visao-geral" className="transition hover:text-white">
              Visão geral
            </a>
            <a href="#agenda" className="transition hover:text-white">
              Agenda
            </a>
            <a href="#fluxo" className="transition hover:text-white">
              Fluxo
            </a>
          </div>

          <div
            className={`rounded-full border px-4 py-2 text-sm backdrop-blur-xl ${
              apiOnline
                ? "border-white/20 bg-white/10 text-white"
                : "border-red-300/20 bg-red-300/10 text-red-100"
            }`}
          >
            {apiOnline ? "API conectada" : "API offline"}
          </div>
        </nav>

        <div className="mx-auto grid min-h-[78vh] max-w-7xl items-center gap-12 pt-16 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-xl">
              <Sparkles size={16} />
              Agendamento acadêmico inteligente
            </div>

            <h2 className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-white md:text-7xl lg:text-8xl">
              O aluno agenda.
              <br />
              O sistema organiza.
            </h2>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Uma experiência moderna para conectar alunos, professores,
              projetos e horários disponíveis, com validação automática
              e visão clara da agenda acadêmica.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#agenda"
                className="group inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-4 font-semibold text-[#2F39E0] transition hover:scale-[1.02]"
              >
                Ver agenda
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </a>

              <a
                href="#fluxo"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 font-semibold text-white backdrop-blur-xl transition hover:bg-white/15"
              >
                Entender fluxo
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="relative"
          >
            <div className="rounded-[2.2rem] border border-white/15 bg-white/10 p-4 shadow-2xl shadow-[#2F39E0]/20 backdrop-blur-2xl">
              <div className="rounded-[1.7rem] bg-[#0E1738]/80 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/60">Painel ativo</p>
                    <h3 className="text-2xl font-bold text-white">
                      Agenda acadêmica
                    </h3>
                  </div>
                  <div className="rounded-full bg-[#2BA7E1]/20 px-3 py-1 text-sm text-white">
                    Ao vivo
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {indicadores.map((item, index) => {
                    const Icon = item.icon;
                    const gradientClasses = [
                      "from-[#2F39E0] to-[#2F70E0]",
                      "from-[#2F70E0] to-[#2BA7E1]",
                      "from-[#5D2BE1] to-[#2F39E0]",
                      "from-[#2BA7E1] to-[#2F70E0]",
                    ];

                    return (
                      <div
                        key={item.label}
                        className={`rounded-3xl border border-white/10 bg-gradient-to-br ${gradientClasses[index]} p-5 text-white`}
                      >
                        <Icon className="mb-5 text-white" size={24} />
                        <p className="text-4xl font-black">{item.value}</p>
                        <p className="mt-1 text-sm text-white/80">
                          {item.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Clock size={18} className="text-white/70" />
                    <p className="font-semibold text-white">Próximas reuniões</p>
                  </div>

                  <div className="space-y-3">
                    {proximasReunioes.length > 0 ? (
                      proximasReunioes.map((reuniao, index) => (
                        <div
                          key={reuniao.reuniao_id || reuniao.id || index}
                          className="rounded-2xl border border-white/10 bg-white/5 p-4"
                        >
                          <p className="font-semibold text-white">
                            {reuniao.projeto_nome || "Projeto acadêmico"}
                          </p>
                          <p className="mt-1 text-sm text-white/70">
                            {reuniao.aluno_nome || "Aluno"} com{" "}
                            {reuniao.professor_nome || "Professor"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-white/70">
                        Rode o seed para carregar dados demonstrativos.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section
        id="visao-geral"
        className="border-y border-white/10 bg-white/[0.04] px-6 py-20 md:px-14 lg:px-20"
      >
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Users />}
            title="Aluno no centro"
            description="O aluno consulta horários disponíveis e realiza o agendamento do próprio projeto."
          />
          <FeatureCard
            icon={<ShieldCheck />}
            title="Validação automática"
            description="O sistema confirma vínculo com projeto, disponibilidade do professor e ausência de conflitos."
          />
          <FeatureCard
            icon={<CalendarCheck />}
            title="Agenda rastreável"
            description="Coordenação, professores e alunos conseguem visualizar a agenda consolidada."
          />
        </div>
      </section>

      <section id="agenda" className="px-6 py-24 md:px-14 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="mb-3 text-sm uppercase tracking-[0.35em] text-white/50">
                Agenda
              </p>
              <h2 className="text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
                Reuniões agendadas
              </h2>
            </div>
            <p className="max-w-xl text-white/70">
              Dados carregados diretamente da sua API FastAPI.
            </p>
          </div>

          <div className="grid gap-4">
            {agenda.length > 0 ? (
              agenda.map((reuniao, index) => (
                <div
                  key={reuniao.reuniao_id || reuniao.id || index}
                  className="grid gap-4 rounded-[1.8rem] border border-white/10 bg-white/8 p-5 backdrop-blur-xl md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]"
                >
                  <div>
                    <p className="text-sm text-white/60">Projeto</p>
                    <h3 className="mt-1 text-xl font-bold text-white">
                      {reuniao.projeto_nome || "Projeto acadêmico"}
                    </h3>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Aluno</p>
                    <p className="mt-1 font-medium text-white">
                      {reuniao.aluno_nome || "Não informado"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-white/60">Professor</p>
                    <p className="mt-1 font-medium text-white">
                      {reuniao.professor_nome || "Não informado"}
                    </p>
                  </div>

                  <div className="flex items-center">
                    <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#2F39E0]">
                      {reuniao.status || "Agendado"}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-white/70">
                Nenhuma reunião encontrada. Rode{" "}
                <code>python scripts/seed_demo.py</code>.
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="fluxo" className="px-6 pb-28 pt-6 md:px-14 lg:px-20">
        <div className="mx-auto max-w-7xl rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#2F39E0]/25 via-[#5D2BE1]/20 to-[#2BA7E1]/20 p-8 backdrop-blur-2xl md:p-12">
          <p className="mb-3 text-sm uppercase tracking-[0.35em] text-white/60">
            Fluxo principal
          </p>

          <h2 className="max-w-3xl text-4xl font-black tracking-[-0.04em] text-white md:text-6xl">
            Do cadastro à reunião confirmada.
          </h2>

          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              "Professor cadastra disponibilidade",
              "Aluno consulta horários",
              "Aluno agenda o projeto",
              "Sistema evita conflitos",
            ].map((item, index) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/10 p-6"
              >
                <p className="mb-8 text-5xl font-black text-white/25">
                  0{index + 1}
                </p>
                <p className="text-lg font-semibold text-white">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/8 p-7 backdrop-blur-xl">
      <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#2F39E0]">
        {icon}
      </div>
      <h3 className="text-2xl font-bold text-white">{title}</h3>
      <p className="mt-4 leading-7 text-white/70">{description}</p>
    </div>
  );
}