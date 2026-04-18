/**
 * routineService — implementação MOCK com persistência em localStorage.
 * Assinaturas idênticas às que serão usadas contra a API C# real.
 * Para migrar: trocar o corpo de cada função por chamadas via `api`.
 */
import { Routine, CreateRoutineDto, UpdateRoutineDto } from './types';

const STORAGE_KEY = 'banking-routines-v2';
const LATENCY_MS = 150;
const delay = <T>(v: T) => new Promise<T>(r => setTimeout(() => r(v), LATENCY_MS));

const read = (): Routine[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Routine[]) : [];
  } catch { return []; }
};
const write = (items: Routine[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

export const routineService = {
  async getRoutines(): Promise<Routine[]> {
    return delay(read());
  },

  async createRoutine(data: CreateRoutineDto): Promise<Routine> {
    const items = read();
    const created: Routine = {
      ...data,
      id: crypto.randomUUID(),
      status: 'AGUARDANDO',
      dt_atualizacao: new Date().toISOString(),
    };
    write([...items, created]);
    return delay(created);
  },

  async updateRoutine(id: string, data: UpdateRoutineDto): Promise<Routine> {
    const items = read();
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Rotina ${id} não encontrada`);
    const updated: Routine = { ...items[idx], ...data, id, dt_atualizacao: new Date().toISOString() };
    items[idx] = updated;
    write(items);
    return delay(updated);
  },

  async deleteRoutine(id: string): Promise<void> {
    write(read().filter(r => r.id !== id));
    return delay(undefined);
  },

  async startReprocessing(id: string, date: string, usuario: string, motivo?: string): Promise<void> {
    const items = read();
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Rotina ${id} não encontrada`);
    items[idx] = {
      ...items[idx],
      status: 'EM_EXECUCAO',
      dt_reprocessamento: date,
      motivo,
      usuario_atualizacao: usuario,
      dt_atualizacao: new Date().toISOString(),
    };
    write(items);
    return delay(undefined);
  },

  async resetStatus(id: string): Promise<void> {
    const items = read();
    const idx = items.findIndex(r => r.id === id);
    if (idx === -1) return;
    items[idx] = { ...items[idx], status: 'AGUARDANDO', dt_atualizacao: new Date().toISOString() };
    write(items);
    return delay(undefined);
  },

  // Util de teste / seed inicial
  _seed(items: Routine[]) { write(items); },
  _hasData() { return read().length > 0; },
};
