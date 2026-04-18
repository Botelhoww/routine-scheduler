import { useState, useEffect, useCallback } from 'react';
import { Routine, RoutinePeriod, DateReference, ControlPattern } from '@/types/routine';
import { CONTROL_PATTERNS } from '@/types/control-pattern';

const STORAGE_KEY = 'banking-routines-v2';
const AUTO_RESET_MS = 3000;

interface NewRoutineInput {
  name: string;
  exePath: string;
  reprocessDate: string;
  dateReference: DateReference;
  period: RoutinePeriod;
  reason?: string;
  tipo_controle: ControlPattern;
  cod_rotina?: string;
  grupo?: string;
  script_preparacao?: string;
  produto_reprocessar?: string;
}

const mk = (
  partial: Omit<Routine, 'banco' | 'tabela_controle' | 'history' | 'status'> & { history?: Routine['history'] },
): Routine => {
  const info = CONTROL_PATTERNS[partial.tipo_controle];
  return {
    ...partial,
    status: 'idle',
    banco: info.banco,
    tabela_controle: info.tabela,
    history: partial.history ?? [],
  };
};

/** Rotina em ERRO com mensagem (exemplos de visibilidade no painel) */
const asError = (base: Routine, errorMessage: string, historyId: string): Routine => ({
  ...base,
  status: 'error',
  errorMessage,
  history: [
    {
      id: historyId,
      date: new Date().toLocaleString('pt-BR'),
      status: 'error',
      duration: '12s',
      errorMessage,
      executedBy: 'Agendador',
    },
    ...base.history,
  ],
});

const createMockRoutines = (): Routine[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const d = fmt(yesterday);

  return [
    // Madrugada — SPB (Padrão F)
    mk({ id: 'm-spb-1', cod_rotina: 'PMAD0001_01', grupo: 'SPB', name: 'PMAD0001_01 — SPB Recebimento', exePath: 'C:\\Bank\\SPB\\PMAD0001_01.exe', reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'F' }),
    mk({ id: 'm-spb-2', cod_rotina: 'PMAD0001_02', grupo: 'SPB', name: 'PMAD0001_02 — SPB Envio', exePath: 'C:\\Bank\\SPB\\PMAD0001_02.exe', reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'F' }),
    mk({ id: 'm-spb-3', cod_rotina: 'PMAD0001_03', grupo: 'SPB', name: 'PMAD0001_03 — SPB Conciliação', exePath: 'C:\\Bank\\SPB\\PMAD0001_03.exe', reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'F' }),
    mk({ id: 'm-spb-4', cod_rotina: 'PMAD0003_3',  grupo: 'SPB', name: 'PMAD0003_3 — SPB Posição',     exePath: 'C:\\Bank\\SPB\\PMAD0003_3.exe',  reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'F' }),
    // Madrugada — BCT (Padrão A)
    mk({ id: 'm-bct-1', cod_rotina: 'PMAD0034_01', grupo: 'BCT', name: 'PMAD0034_01 — BCT Carga',      exePath: 'C:\\Bank\\BCT\\PMAD0034_01.exe', reprocessDate: d, dateReference: 'D0',  period: 'dawn', tipo_controle: 'A', script_preparacao: 'UPDATE db_stage_bi.dbo.tab_controle_bi_reprocessamento SET dt_referencia = @data WHERE cod_rotina = \'PMAD0034_01\';' }),
    mk({ id: 'm-bct-2', cod_rotina: 'PMAD0000',    grupo: 'BCT', name: 'PMAD0000 — BCT Inicialização', exePath: 'C:\\Bank\\BCT\\PMAD0000.exe',    reprocessDate: d, dateReference: 'D0',  period: 'dawn', tipo_controle: 'A' }),
    // Madrugada — PNL
    mk({ id: 'm-pnl-1', cod_rotina: 'PMAD0030_01', grupo: 'PNL', name: 'PMAD0030_01 — PNL Carga',      exePath: 'C:\\Bank\\PNL\\PMAD0030_01.exe', reprocessDate: d, dateReference: 'D0',  period: 'dawn', tipo_controle: 'A' }),
    mk({ id: 'm-pnl-2', cod_rotina: 'PMAD0002_1',  grupo: 'PNL', name: 'PMAD0002_1 — PNL Apuração',    exePath: 'C:\\Bank\\PNL\\PMAD0002_1.exe',  reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'B' }),
    mk({ id: 'm-pnl-3', cod_rotina: 'PMAD0032',    grupo: 'PNL', name: 'PMAD0032 — PNL Fechamento',    exePath: 'C:\\Bank\\PNL\\PMAD0032.exe',    reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'B' }),
    mk({ id: 'm-pnl-4', cod_rotina: 'PMAD0032_02', grupo: 'PNL', name: 'PMAD0032_02 — PNL Detalhe',    exePath: 'C:\\Bank\\PNL\\PMAD0032_02.exe', reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'B' }),
    asError(
      mk({ id: 'm-err-demo-1', cod_rotina: 'PMAD0099', grupo: 'DEMO', name: 'PMAD0099 — Exemplo ERRO (Madrugada)', exePath: 'C:\\Bank\\DEMO\\PMAD0099.exe', reprocessDate: d, dateReference: 'D-1', period: 'dawn', tipo_controle: 'F' }),
      'Falha de conexão com o banco: timeout após 30s (servidor 10.1.0.12, instância STAGE).',
      'hist-err-m-1',
    ),

    // Matutino — BI
    mk({ id: 't-bi-1', cod_rotina: 'PMAT0029',    grupo: 'BI', name: 'PMAT0029 — BI Diário',          exePath: 'C:\\Bank\\BI\\PMAT0029.exe',    reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'B' }),
    mk({ id: 't-bi-2', cod_rotina: 'PMAT0045',    grupo: 'BI', name: 'PMAT0045 — BI Consolidação',    exePath: 'C:\\Bank\\BI\\PMAT0045.exe',    reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'B' }),
    mk({ id: 't-bi-3', cod_rotina: 'PMAT0028_01', grupo: 'BI', name: 'PMAT0028_01 — BI Reconciliação', exePath: 'C:\\Bank\\BI\\PMAT0028_01.exe', reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-4', cod_rotina: 'PMAT0014_ESTOQUE', grupo: 'BI', name: 'PMAT0014 — ESTOQUE',  exePath: 'C:\\Bank\\BI\\PMAT0014_ESTOQUE.exe',  reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-5', cod_rotina: 'PMAT0014_MOVTO',   grupo: 'BI', name: 'PMAT0014 — MOVTO',    exePath: 'C:\\Bank\\BI\\PMAT0014_MOVTO.exe',    reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-6', cod_rotina: 'PMAT0014_POSIC',   grupo: 'BI', name: 'PMAT0014 — POSIC',    exePath: 'C:\\Bank\\BI\\PMAT0014_POSIC.exe',    reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-7', cod_rotina: 'PMAT0014_CHANGE', grupo: 'BI', name: 'PMAT0014 — CHANGE',   exePath: 'C:\\Bank\\BI\\PMAT0014_CHANGE.exe',   reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-8', cod_rotina: 'PMAT0014_VIRTUAL', grupo: 'BI', name: 'PMAT0014 — VIRTUAL',  exePath: 'C:\\Bank\\BI\\PMAT0014_VIRTUAL.exe',  reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    mk({ id: 't-bi-9', cod_rotina: 'PMAT0014_AUTBANK', grupo: 'BI', name: 'PMAT0014 — AUTBANK',  exePath: 'C:\\Bank\\BI\\PMAT0014_AUTBANK.exe',  reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'D' }),
    asError(
      mk({ id: 't-err-demo-1', cod_rotina: 'PMAT0099', grupo: 'DEMO', name: 'PMAT0099 — Exemplo ERRO (Matutino)', exePath: 'C:\\Bank\\DEMO\\PMAT0099.exe', reprocessDate: d, dateReference: 'D-1', period: 'morning', tipo_controle: 'B' }),
      'value cannot be null "dt_referencia" ao atualizar dbo.tab_controle_bi_reprocessamento',
      'hist-err-t-1',
    ),

    // Noturno — BACEN (Padrão F)
    mk({ id: 'n-bcn-1', cod_rotina: 'PNOT0001', grupo: 'BACEN', name: 'PNOT0001 — BACEN Envio',    exePath: 'C:\\Bank\\BACEN\\PNOT0001.exe', reprocessDate: d, dateReference: 'D+1', period: 'night', tipo_controle: 'F' }),
    mk({ id: 'n-bcn-2', cod_rotina: 'PNOT0002', grupo: 'BACEN', name: 'PNOT0002 — BACEN Posição',  exePath: 'C:\\Bank\\BACEN\\PNOT0002.exe', reprocessDate: d, dateReference: 'D+1', period: 'night', tipo_controle: 'F' }),
    asError(
      mk({ id: 'n-err-demo-1', cod_rotina: 'PNOT0099', grupo: 'DEMO', name: 'PNOT0099 — Exemplo ERRO (Noturno)', exePath: 'C:\\Bank\\DEMO\\PNOT0099.exe', reprocessDate: d, dateReference: 'D+1', period: 'night', tipo_controle: 'F' }),
      'Integração BACEN retornou código REJ998: arquivo de posição rejeitado por inconsistência de saldo.',
      'hist-err-n-1',
    ),
  ];
};

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored) as Routine[]; } catch { /* fall through */ }
    }
    const mock = createMockRoutines();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
    return mock;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }, [routines]);

  const addRoutine = useCallback((input: NewRoutineInput) => {
    const info = CONTROL_PATTERNS[input.tipo_controle];
    setRoutines(prev => [
      ...prev,
      {
        ...input,
        id: crypto.randomUUID(),
        status: 'idle',
        banco: info.banco,
        tabela_controle: info.tabela,
        history: [],
      },
    ]);
  }, []);

  const updateRoutine = useCallback((id: string, updates: Partial<Routine>) => {
    setRoutines(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...updates };
      // Mantém banco/tabela em sincronia com tipo_controle
      if (updates.tipo_controle) {
        const info = CONTROL_PATTERNS[updates.tipo_controle];
        next.banco = info.banco;
        next.tabela_controle = info.tabela;
      }
      return next;
    }));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  const resetStatus = useCallback((id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, status: 'idle', errorMessage: undefined } : r));
  }, []);

  const startReprocessing = useCallback((id: string, reason?: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, status: 'running', reason: reason || r.reason } : r));
    const duration = 3000 + Math.random() * 2000;
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setRoutines(prev => prev.map(r => {
        if (r.id !== id) return r;
        const entry = {
          id: crypto.randomUUID(),
          date: new Date().toLocaleString('pt-BR'),
          status: success ? 'success' as const : 'error' as const,
          duration: `${Math.floor(duration / 1000)}s`,
          executedBy: 'João Silva',
          reason: r.reason,
          ...(success ? {} : { errorMessage: 'Falha na conexão com o banco de dados' }),
        };
        return {
          ...r,
          status: success ? 'success' : 'error',
          errorMessage: success ? undefined : entry.errorMessage,
          history: [entry, ...r.history].slice(0, 5),
        };
      }));

      // Auto-reset CONCLUIDO -> AGUARDANDO após 3s; ERRO permanece até reset manual
      if (success) {
        setTimeout(() => {
          setRoutines(prev => prev.map(r => r.id === id && r.status === 'success' ? { ...r, status: 'idle' } : r));
        }, AUTO_RESET_MS);
      }
    }, duration);
  }, []);

  const getByPeriod = useCallback((period: RoutinePeriod) => routines.filter(r => r.period === period), [routines]);

  return { routines, addRoutine, updateRoutine, deleteRoutine, startReprocessing, resetStatus, getByPeriod };
}

export function calculateProcessingDate(baseDate: string, ref: DateReference): string {
  const d = new Date(baseDate + 'T12:00:00');
  if (ref === 'D-1') d.setDate(d.getDate() - 1);
  if (ref === 'D+1') d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('pt-BR');
}

/** Date string ISO (YYYY-MM-DD) — usado para mostrar o que será gravado no banco em B/D */
export function calculateMinusOneIso(baseDate: string, ref: DateReference): string {
  const d = new Date(baseDate + 'T12:00:00');
  if (ref === 'D-1') d.setDate(d.getDate() - 1);
  if (ref === 'D+1') d.setDate(d.getDate() + 1);
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString('pt-BR');
}
