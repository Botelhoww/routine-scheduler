export type RoutineStatus = 'idle' | 'running' | 'success' | 'error';
export type DateReference = 'D-1' | 'D0' | 'D+1';
export type RoutinePeriod = 'dawn' | 'morning' | 'night';

export interface ExecutionHistory {
  id: string;
  date: string;
  status: 'success' | 'error';
  duration: string;
  errorMessage?: string;
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
  history: ExecutionHistory[];
}
