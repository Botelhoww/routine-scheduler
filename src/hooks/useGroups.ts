import { useCallback, useEffect, useState } from 'react';
import { Routine } from '@/types/routine';

const STORAGE_KEY = 'bsg-groups-v1';

export interface Group {
  sigla: string;
  name: string;
}

interface PersistedShape {
  groups: Group[];
}

/** Grupos derivados das próprias rotinas (usados como fallback descritivo). */
function deriveFromRoutines(routines: Routine[]): Group[] {
  const set = new Set<string>();
  for (const r of routines) {
    if (r.grupo && r.grupo.trim()) set.add(r.grupo.trim());
  }
  return Array.from(set).sort().map(sigla => ({ sigla, name: sigla }));
}

function load(): Group[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedShape;
    if (!parsed?.groups || !Array.isArray(parsed.groups)) return null;
    return parsed.groups.filter(g => typeof g.sigla === 'string' && typeof g.name === 'string');
  } catch { return null; }
}

function save(groups: Group[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ groups })); } catch { /* ignore */ }
}

/**
 * Gerencia a lista de grupos (sigla → nome descritivo).
 * Faz merge entre o que está persistido e o que é derivado das rotinas existentes,
 * para que grupos vindos do mock continuem aparecendo mesmo sem cadastro manual.
 */
export function useGroups(routines: Routine[]) {
  const [stored, setStored] = useState<Group[]>(() => load() ?? []);

  useEffect(() => { save(stored); }, [stored]);

  const merged: Group[] = (() => {
    const map = new Map<string, Group>();
    for (const g of deriveFromRoutines(routines)) map.set(g.sigla, g);
    // os manuais sobrescrevem o nome derivado
    for (const g of stored) map.set(g.sigla, g);
    return Array.from(map.values()).sort((a, b) => a.sigla.localeCompare(b.sigla));
  })();

  const createGroup = useCallback((sigla: string, name: string) => {
    const finalSigla = sigla.trim().toUpperCase().slice(0, 8);
    const finalName = name.trim().slice(0, 80);
    if (!finalSigla || !finalName) return;
    setStored(prev => {
      const exists = prev.some(g => g.sigla === finalSigla);
      if (exists) return prev.map(g => g.sigla === finalSigla ? { ...g, name: finalName } : g);
      return [...prev, { sigla: finalSigla, name: finalName }];
    });
  }, []);

  /** Busca o nome descritivo de uma sigla; retorna a própria sigla como fallback. */
  const getName = useCallback((sigla: string) => {
    const found = merged.find(g => g.sigla === sigla);
    return found?.name ?? sigla;
  }, [merged]);

  return { groups: merged, createGroup, getName };
}
