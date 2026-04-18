import { ControlPattern } from './control-pattern';

export type RoutineStatus = 'idle' | 'running' | 'success' | 'error';
export type DateReference = 'D-1' | 'D0' | 'D+1';
export type RoutinePeriod = 'dawn' | 'morning' | 'night';

/** Mapeamento entre status interno (UI) e status da API */
export const STATUS_API_MAP: Record<RoutineStatus, 'AGUARDANDO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ERRO'> = {
  idle: 'AGUARDANDO',
  running: 'EM_EXECUCAO',
  success: 'CONCLUIDO',
  error: 'ERRO',
};

export const PERIOD_API_MAP: Record<RoutinePeriod, 'MADRUGADA' | 'MATUTINO' | 'NOTURNO'> = {
  dawn: 'MADRUGADA',
  morning: 'MATUTINO',
  night: 'NOTURNO',
};

export interface ExecutionHistory {
  id: string;
  date: string;
  status: 'success' | 'error';
  duration: string;
  errorMessage?: string;
  executedBy?: string;
  reason?: string;
}

export interface Routine {
  id: string;
  name: string;
  exePath: string;
  reprocessDate: string;
  dateReference: DateReference;
  status: RoutineStatus;
  period: RoutinePeriod;
  errorMessage?: string;
  reason?: string;
  history: ExecutionHistory[];

  // Novos campos (controle de reprocessamento)
  tipo_controle: ControlPattern;
  banco: string;
  tabela_controle: string;
  cod_rotina?: string;
  grupo?: string;
  script_preparacao?: string;
  produto_reprocessar?: string;
}

export type { ControlPattern } from './control-pattern';
