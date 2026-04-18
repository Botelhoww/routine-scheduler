import { Routine } from '@/types/routine';

/** Retorna `null` se a rotina pode iniciar reprocessamento; caso contrário, motivo bloqueante. */
export function getRoutineStartBlockedReason(routine: Routine): string | null {
  if (!routine.reprocessDate) return 'Selecione uma data antes de iniciar';
  const isExeValid = routine.exePath.toLowerCase().endsWith('.exe');
  if (!isExeValid) return 'Caminho do .exe inválido';
  if (routine.status === 'running') return 'Rotina já em execução';
  if (routine.status === 'error') return 'Resete o status (ERRO) antes de reiniciar';
  return null;
}
