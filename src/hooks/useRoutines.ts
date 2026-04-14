import { useState, useEffect, useCallback } from 'react';
import { Routine, RoutinePeriod, DateReference } from '@/types/routine';

const STORAGE_KEY = 'banking-routines';

const createMockRoutines = (): Routine[] => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const fmt = (d: Date) => d.toISOString().split('T')[0];

  return [
    {
      id: '1', name: 'Apuração de CDI', exePath: 'C:\\Bank\\Routines\\apuracao_cdi.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D-1', status: 'idle', period: 'dawn',
      history: [
        { id: 'h1', date: '2025-04-10 02:15', status: 'success', duration: '3m 22s', executedBy: 'João Silva' },
        { id: 'h2', date: '2025-04-09 02:14', status: 'success', duration: '3m 18s', executedBy: 'João Silva' },
      ],
    },
    {
      id: '2', name: 'Fechamento de Posições', exePath: 'C:\\Bank\\Routines\\fechamento_posicoes.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D0', status: 'idle', period: 'dawn',
      history: [
        { id: 'h3', date: '2025-04-10 03:00', status: 'error', duration: '1m 05s', errorMessage: 'Timeout de conexão com o servidor', executedBy: 'João Silva' },
      ],
    },
    {
      id: '3', name: 'Cálculo de SELIC', exePath: 'C:\\Bank\\Routines\\calculo_selic.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D0', status: 'idle', period: 'morning',
      history: [],
    },
    {
      id: '4', name: 'Marcação a Mercado', exePath: 'C:\\Bank\\Routines\\marcacao_mercado.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D-1', status: 'idle', period: 'morning',
      history: [
        { id: 'h4', date: '2025-04-10 08:30', status: 'success', duration: '5m 42s', executedBy: 'João Silva' },
        { id: 'h5', date: '2025-04-09 08:28', status: 'success', duration: '5m 38s', executedBy: 'João Silva' },
      ],
    },
    {
      id: '5', name: 'Envio BACEN', exePath: 'C:\\Bank\\Routines\\envio_bacen.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D+1', status: 'idle', period: 'night',
      history: [
        { id: 'h6', date: '2025-04-10 19:00', status: 'success', duration: '2m 10s', executedBy: 'João Silva' },
      ],
    },
    {
      id: '6', name: 'Cálculo de Cotas', exePath: 'C:\\Bank\\Routines\\calculo_cotas.exe',
      reprocessDate: fmt(yesterday), dateReference: 'D0', status: 'idle', period: 'night',
      history: [],
    },
  ];
};

export function useRoutines() {
  const [routines, setRoutines] = useState<Routine[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
    const mock = createMockRoutines();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
    return mock;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
  }, [routines]);

  const addRoutine = useCallback((routine: Omit<Routine, 'id' | 'status' | 'history'>) => {
    setRoutines(prev => [...prev, { ...routine, id: crypto.randomUUID(), status: 'idle', history: [] }]);
  }, []);

  const updateRoutine = useCallback((id: string, updates: Partial<Routine>) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  }, []);

  const deleteRoutine = useCallback((id: string) => {
    setRoutines(prev => prev.filter(r => r.id !== id));
  }, []);

  const startReprocessing = useCallback((id: string, reason?: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, status: 'running', reason: reason || r.reason } : r));
    const duration = 3000 + Math.random() * 5000;
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
    }, duration);
  }, []);

  const getByPeriod = useCallback((period: RoutinePeriod) => routines.filter(r => r.period === period), [routines]);

  return { routines, addRoutine, updateRoutine, deleteRoutine, startReprocessing, getByPeriod };
}

export function calculateProcessingDate(baseDate: string, ref: DateReference): string {
  const d = new Date(baseDate + 'T12:00:00');
  if (ref === 'D-1') d.setDate(d.getDate() - 1);
  if (ref === 'D+1') d.setDate(d.getDate() + 1);
  return d.toLocaleDateString('pt-BR');
}
