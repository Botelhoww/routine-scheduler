/**
 * Tipos da camada de API — alinhados ao contrato esperado do backend C#.
 * Usados pelos services. O frontend mantém um modelo interno em src/types/routine.ts
 * que é mapeado para/destes tipos no boundary do service.
 */

export type ControlPattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type RoutineStatusApi = 'AGUARDANDO' | 'EM_EXECUCAO' | 'CONCLUIDO' | 'ERRO';
export type RoutinePeriodApi = 'MADRUGADA' | 'MATUTINO' | 'NOTURNO';

export interface Routine {
  id: string;
  cod_rotina: string;
  nome_rotina: string;
  caminho_exe: string;
  grupo: string;
  periodo: RoutinePeriodApi;
  dt_referencia: string | null;       // 'D-1' | 'D0' | 'D+1'
  dt_reprocessamento: string | null;  // ISO date 'YYYY-MM-DD'
  status: RoutineStatusApi;
  tipo_controle: ControlPattern;
  banco: string;
  tabela_controle: string;
  script_preparacao?: string;
  produto_reprocessar?: string;       // apenas Padrão E
  motivo?: string;
  usuario_atualizacao?: string;
  dt_atualizacao?: string;
}

export interface CreateRoutineDto extends Omit<Routine, 'id' | 'status' | 'dt_atualizacao'> {}
export interface UpdateRoutineDto extends Partial<Omit<Routine, 'id'>> {}

export interface StartReprocessingDto {
  dt_reprocessamento: string;
  usuario: string;
  motivo?: string;
}
