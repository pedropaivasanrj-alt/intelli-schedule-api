export type Professor = {
  id: number;
  nome: string;
  email: string;
  departamento?: string | null;
  ativo: boolean;
};

export type Aluno = {
  id: number;
  nome: string;
  email: string;
  matricula?: string | null;
  curso?: string | null;
  ativo: boolean;
};

export type ProjetoProfessor = {
  professor_id: number;
  professor_nome?: string | null;
  professor_email?: string | null;
  papel_no_projeto: string;
};

export type ProjetoAluno = {
  aluno_id: number;
  aluno_nome?: string | null;
  aluno_email?: string | null;
};

export type Projeto = {
  id: number;
  nome: string;
  resumo: string;
  caracteristicas: string;
  objetivo?: string | null;
  descricao_foco?: string | null;
  status: string;
  alunos_envolvidos: string;
  professores: ProjetoProfessor[];
  alunos: ProjetoAluno[];
};

export type Reuniao = {
  reuniao_id: number;
  projeto_id: number;
  projeto_nome: string | null;
  professor_id: number;
  professor_nome: string | null;
  aluno_id: number | null;
  aluno_nome: string | null;
  ciclo_avaliacao?: string;
  data_hora_inicio: string;
  data_hora_fim: string;
  status: string;
};

export type HistoricoReuniao = {
  id: number;
  projeto_id: number;
  reuniao_id?: number | null;
  professor_id?: number | null;
  professor_nome?: string | null;
  titulo: string;
  resumo: string;
  decisoes?: string | null;
  pendencias?: string | null;
  proximos_passos?: string | null;
  data_registro?: string | null;
  atualizado_em?: string | null;
};

export type UsuarioSistema = {
  id: number;
  nome: string;
  email: string;
  papel: string;
  ativo: boolean;
};

export type DashboardResumo = {
  usuario: {
    id: number;
    nome: string;
    papel: string;
  };
  indicadores: {
    professores: number;
    alunos: number;
    projetos: number;
    reunioes_agendadas: number;
    projetos_sem_agendamento: number;
    projetos_sem_reuniao_recente: number;
  };
  proximos_agendamentos: Reuniao[];
};

export type AcessoLog = {
  id: number;
  usuario_email?: string | null;
  papel?: string | null;
  acao: string;
  recurso: string;
  detalhes?: string | null;
  criado_em: string;
};
