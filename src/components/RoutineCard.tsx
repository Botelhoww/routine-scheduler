import { useState } from 'react';
import { Routine } from '@/types/routine';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { getRoutineStartBlockedReason } from '@/lib/routine-eligibility';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ConfirmReprocessDialog } from './ConfirmReprocessDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { RoutineSheet, GroupOption } from './RoutineSheet';
import { InlineHistory } from './InlineHistory';
import {
  Play, Pencil, Trash2, History, RotateCcw, FileText,
  Loader2, AlertCircle, ChevronDown, Folder,
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  routine: Routine;
  groups: GroupOption[];
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  onCreateGroup: (sigla: string, name: string) => void;
}

const REF_BADGE: Record<Routine['dateReference'], string> = {
  'D-1': 'bg-[#FFF3E0] text-[#854F0B]',
  'D0':  'bg-[#E8EDF5] text-[#0A2540]',
  'D+1': 'bg-[#FEE2E2] text-[#A32D2D]',
};

const STATUS_BADGE: Record<Routine['status'], { label: string; cls: string; spinner?: boolean }> = {
  idle:    { label: 'AGUARDANDO',  cls: 'bg-[#F0F0F0] text-[#666]' },
  running: { label: 'EM EXECUÇÃO', cls: 'bg-[#E8EDF5] text-[#0A2540]', spinner: true },
  success: { label: 'CONCLUÍDO',   cls: 'bg-[#E8F5E9] text-[#1B5E20]' },
  error:   { label: 'ERRO',        cls: 'bg-[#FEE2E2] text-[#E30613] font-semibold' },
};

export function RoutineCard({ routine, onUpdate, onDelete, onStart, onReset }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorDetailOpen, setErrorDetailOpen] = useState(false);

  const processedDate = calculateProcessingDate(routine.reprocessDate, routine.dateReference);
  const blockedReason = getRoutineStartBlockedReason(routine);
  const canStart = !blockedReason;
  const actionsLocked = routine.status === 'running';

  const errorDetail =
    routine.errorMessage?.trim() ||
    routine.history.find(h => h.status === 'error')?.errorMessage?.trim();

  const status = STATUS_BADGE[routine.status];

  return (
    <div
      className={cn(
        'group relative grid items-center gap-3 px-4 py-2.5 text-xs transition-colors border-b border-[#F0F1F3] last:border-b-0',
        'grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.9fr)]',
        routine.status === 'idle'    && 'bg-white hover:bg-[#FAFAFA]',
        routine.status === 'success' && 'bg-white hover:bg-[#FAFAFA]',
        routine.status === 'running' && 'bg-[#F0F7FF] border-l-[3px] border-l-[#378ADD]',
        routine.status === 'error'   && 'bg-[#FFF8F8] border-l-[3px] border-l-[#E30613]',
      )}
    >
      {/* IDENTIDADE */}
      <div className="min-w-0">
        {routine.cod_rotina && (
          <div className="font-mono text-[11px] text-[#888] truncate">{routine.cod_rotina}</div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-medium text-[#1a1a1a] truncate">{routine.name}</span>
          {routine.reason && (
            <Tooltip>
              <TooltipTrigger asChild>
                <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{routine.reason}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {routine.grupo && (
          <div className="text-[11px] text-[#aaa] truncate">Grupo: {routine.grupo}</div>
        )}
      </div>

      {/* PADRÃO + BANCO */}
      <div className="min-w-0 space-y-1">
        <span className="inline-flex items-center rounded border border-[#E2E4E8] bg-white px-1.5 py-0.5 text-[11px] text-[#444]">
          Padrão {routine.tipo_controle}
        </span>
        <div className="font-mono text-[11px] text-[#888] truncate">{routine.banco}</div>
      </div>

      {/* EXECUTÁVEL */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5 min-w-0 cursor-default">
            <Folder className="h-3 w-3 shrink-0 text-[#888]" />
            <span className="font-mono text-[11px] text-[#666] truncate">{routine.exePath}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs font-mono">{routine.exePath}</TooltipContent>
      </Tooltip>

      {/* REF + DATA */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className={cn('inline-flex w-fit items-center rounded px-1.5 py-0.5 text-[11px] font-mono font-medium', REF_BADGE[routine.dateReference])}>
          {routine.dateReference}
        </span>
        <span className="text-[11px] text-[#888]">→ {processedDate}</span>
      </div>

      {/* STATUS */}
      <div className="flex justify-start min-w-0">
        <span className={cn('inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] tracking-wide whitespace-nowrap', status.cls)}>
          {status.spinner && <Loader2 className="h-3 w-3 animate-spin" />}
          {routine.status === 'error' && <AlertCircle className="h-3 w-3" />}
          {status.label}
        </span>
      </div>

      {/* AÇÕES */}
      <div className="flex items-center gap-0.5 justify-end">
        {/* Play */}
        {routine.status === 'running' ? (
          <Button size="icon" variant="ghost" disabled className="h-7 w-7 text-[#378ADD] opacity-100">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => canStart && setConfirmStart(true)}
                  disabled={!canStart}
                  className={cn('h-7 w-7', canStart && 'text-[#1B5E20] hover:text-[#1B5E20] hover:bg-[#1B5E20]/10')}
                  aria-label="Reprocessar"
                >
                  <Play className="h-3.5 w-3.5" fill={canStart ? 'currentColor' : 'none'} />
                </Button>
              </span>
            </TooltipTrigger>
            {!canStart && <TooltipContent className="text-xs">{blockedReason}</TooltipContent>}
          </Tooltip>
        )}

        {/* Reset (apenas em erro) */}
        {routine.status === 'error' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" onClick={() => onReset(routine.id)} className="h-7 w-7 text-[#E30613] hover:text-[#E30613] hover:bg-[#E30613]/10">
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Resetar para AGUARDANDO</TooltipContent>
          </Tooltip>
        )}

        {/* Histórico */}
        {routine.history.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowHistory(v => !v)}
                disabled={actionsLocked}
                className="h-7 w-7 relative text-[#666]"
              >
                <History className="h-3.5 w-3.5" />
                <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">
                  {routine.history.length}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="text-xs">Histórico ({routine.history.length})</TooltipContent>
          </Tooltip>
        )}

        {/* Editar */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setEditing(true)}
          disabled={actionsLocked}
          className="h-7 w-7 text-[#666] hover:text-[#1a1a1a]"
          aria-label="Editar"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        {/* Deletar */}
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setConfirmDelete(true)}
          disabled={actionsLocked}
          className="h-7 w-7 text-[#999] hover:text-[#E30613] hover:bg-[#E30613]/10"
          aria-label="Excluir"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Detalhe do erro (linha extra abaixo, ocupando o card todo) */}
      {routine.status === 'error' && errorDetail && (
        <div className="col-span-full -mx-4 -mb-2.5 mt-2.5 bg-[#FEF2F2] border-t border-[#FCA5A5]/40">
          <Collapsible open={errorDetailOpen} onOpenChange={setErrorDetailOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#E30613] hover:bg-[#FEE2E2]">
              <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', errorDetailOpen && 'rotate-180')} />
              Detalhe do erro
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-2 pt-1 text-[12px] leading-relaxed text-[#E30613] whitespace-pre-wrap">
                {errorDetail}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Histórico inline */}
      {showHistory && routine.history.length > 0 && (
        <div className="col-span-full -mx-4 -mb-2.5 mt-2.5 bg-[#FAFAFA] border-t border-[#E2E4E8] px-4 py-2">
          <InlineHistory history={routine.history} onClose={() => setShowHistory(false)} />
        </div>
      )}

      <ConfirmReprocessDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        routine={routine}
        processedDate={processedDate}
        onConfirm={(reason) => { onStart(routine.id, reason); setConfirmStart(false); }}
      />

      <EditRoutineSheet
        open={editing}
        onOpenChange={setEditing}
        routine={routine}
        onSave={onUpdate}
      />

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Excluir Rotina"
        description={`Tem certeza que deseja excluir "${routine.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => { onDelete(routine.id); setConfirmDelete(false); }}
      />
    </div>
  );
}
