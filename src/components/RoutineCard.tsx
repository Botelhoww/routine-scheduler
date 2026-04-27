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
  AlertCircle, ChevronDown,
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

const STATUS_LABEL: Record<Routine['status'], string> = {
  idle: 'aguardando', running: 'em execução', success: 'concluído', error: 'erro',
};
const STATUS_DOT: Record<Routine['status'], string> = {
  idle: 'status-dot--idle', running: 'status-dot--running',
  success: 'status-dot--success', error: 'status-dot--error',
};

export function RoutineCard({
  routine, groups, onUpdate, onDelete, onStart, onReset, onCreateGroup,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorDetailOpen, setErrorDetailOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const processedDate = calculateProcessingDate(routine.reprocessDate, routine.dateReference);
  const blockedReason = getRoutineStartBlockedReason(routine);
  const canStart = !blockedReason;
  const actionsLocked = routine.status === 'running';

  const errorDetail =
    routine.errorMessage?.trim() ||
    routine.history.find(h => h.status === 'error')?.errorMessage?.trim();

  const isError = routine.status === 'error';
  const isRunning = routine.status === 'running';

  return (
    <div
      className={cn(
        'group relative border-b border-border/60 last:border-b-0',
        // barra lateral fina apenas em erro/running
        isError   && 'border-l-[3px] border-l-[hsl(var(--status-error))] bg-[hsl(var(--status-error)/0.035)]',
        isRunning && 'border-l-[3px] border-l-[hsl(var(--status-running))] bg-[hsl(var(--status-running)/0.03)]',
        !isError && !isRunning && 'border-l-[3px] border-l-transparent hover:bg-[hsl(var(--surface-muted))]',
      )}
    >
      <div
        onClick={() => setExpanded(v => !v)}
        className={cn(
          'grid items-center h-9 px-3 gap-3 text-[12.5px] cursor-pointer select-none',
          // status / nome+code / padrão / banco / exe / ref / ações
          'grid-cols-[14px_minmax(0,2.4fr)_42px_minmax(0,1fr)_minmax(0,1.6fr)_88px_auto]',
        )}
      >
        {/* status dot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('status-dot', STATUS_DOT[routine.status])} aria-label={STATUS_LABEL[routine.status]} />
          </TooltipTrigger>
          <TooltipContent className="text-xs capitalize">{STATUS_LABEL[routine.status]}</TooltipContent>
        </Tooltip>

        {/* nome + código */}
        <div className="min-w-0 flex items-center gap-2">
          <span className={cn('truncate', isError ? 'text-foreground font-medium' : 'text-foreground')}>
            {routine.name}
          </span>
          {routine.cod_rotina && (
            <span className="font-tech text-[11px] text-muted-foreground/70 truncate shrink-0">
              {routine.cod_rotina}
            </span>
          )}
          {routine.reason && (
            <Tooltip>
              <TooltipTrigger asChild>
                <FileText className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{routine.reason}</TooltipContent>
            </Tooltip>
          )}
          {isError && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[hsl(var(--status-error))] shrink-0">
              <AlertCircle className="h-3 w-3" /> ERRO
            </span>
          )}
        </div>

        {/* padrão */}
        <span className="font-tech text-[11px] text-muted-foreground tabular-nums">
          {routine.tipo_controle}
        </span>

        {/* banco */}
        <span className="font-tech text-[11px] text-muted-foreground/80 truncate">
          {routine.banco}
        </span>

        {/* exe */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-tech text-[11px] text-muted-foreground/80 truncate">
              {routine.exePath}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs font-tech max-w-md break-all">{routine.exePath}</TooltipContent>
        </Tooltip>

        {/* referência + data */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('font-tech text-[11px] tabular-nums', REF_TONE[routine.dateReference])}>
              {routine.dateReference}
            </span>
          </TooltipTrigger>
          <TooltipContent className="text-xs font-tech">{processedDate}</TooltipContent>
        </Tooltip>

        {/* ações — reveladas no hover */}
        <div
          className="flex items-center gap-0.5 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* PLAY — ação primária, sempre visível e destacada */}
          {!isRunning && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="icon"
                    onClick={() => canStart && setConfirmStart(true)}
                    disabled={!canStart}
                    className={cn(
                      'h-8 w-8 rounded-md',
                      canStart
                        ? 'bg-[hsl(var(--status-success))] text-white hover:bg-[hsl(var(--status-success)/0.85)]'
                        : 'bg-muted text-muted-foreground/50',
                    )}
                    aria-label="Reprocessar"
                  >
                    <Play className="h-3.5 w-3.5" fill="currentColor" />
                  </Button>
                </span>
              </TooltipTrigger>
              {!canStart && <TooltipContent className="text-xs">{blockedReason}</TooltipContent>}
            </Tooltip>
          )}

          {isError && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost"
                  onClick={() => onReset(routine.id)}
                  className="h-8 w-8 text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error)/0.1)]"
                  aria-label="Resetar"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Resetar para AGUARDANDO</TooltipContent>
            </Tooltip>
          )}

          {routine.history.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon" variant="ghost"
                  onClick={() => setShowHistory(v => !v)}
                  disabled={actionsLocked}
                  className="h-8 w-8 relative text-muted-foreground hover:text-foreground"
                  aria-label="Histórico"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-medium bg-foreground text-background rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">
                    {routine.history.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Histórico ({routine.history.length})</TooltipContent>
            </Tooltip>
          )}

          <Button
            size="icon" variant="ghost"
            onClick={() => setEditing(true)}
            disabled={actionsLocked}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Editar"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          <Button
            size="icon" variant="ghost"
            onClick={() => setConfirmDelete(true)}
            disabled={actionsLocked}
            className="h-8 w-8 text-muted-foreground hover:text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error)/0.1)]"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Erro: prévia parcial sempre visível, expande pelo collapsible */}
      {isError && errorDetail && (
        <div className="border-t border-[hsl(var(--status-error)/0.2)] bg-[hsl(var(--status-error)/0.05)]">
          <Collapsible open={errorDetailOpen} onOpenChange={setErrorDetailOpen}>
            <div className="flex items-start gap-2 px-3 py-1.5">
              <CollapsibleTrigger
                onClick={(e) => e.stopPropagation()}
                className="shrink-0 mt-0.5 text-[hsl(var(--status-error))] hover:opacity-80"
              >
                <ChevronDown className={cn('h-3 w-3 transition-transform', errorDetailOpen && 'rotate-180')} />
              </CollapsibleTrigger>
              <p className={cn(
                'text-[11px] font-tech text-[hsl(var(--status-error))] leading-snug flex-1 min-w-0',
                !errorDetailOpen && 'truncate',
              )}>
                {errorDetail}
              </p>
            </div>
            <CollapsibleContent>
              <div className="px-3 pb-2 pl-8 text-[11px] font-tech text-[hsl(var(--status-error))] whitespace-pre-wrap leading-snug">
                {errorDetail}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Histórico inline */}
      {showHistory && routine.history.length > 0 && (
        <div className="border-t border-border bg-[hsl(var(--surface-muted))] px-3 py-2">
          <InlineHistory history={routine.history} onClose={() => setShowHistory(false)} />
        </div>
      )}

      {/* Expansão por clique na linha — detalhes adicionais */}
      {expanded && !showHistory && (
        <div className="border-t border-border bg-[hsl(var(--surface-muted))] px-3 py-2 grid grid-cols-4 gap-x-6 gap-y-1 text-[11px] font-tech">
          <div><span className="text-muted-foreground/70">tabela: </span>{routine.tabela_controle || '—'}</div>
          <div><span className="text-muted-foreground/70">processada: </span>{processedDate}</div>
          <div><span className="text-muted-foreground/70">ref: </span>{routine.dateReference}</div>
          <div><span className="text-muted-foreground/70">grupo: </span>{routine.grupo || 'GERAL'}</div>
        </div>
      )}

      <ConfirmReprocessDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        routine={routine}
        processedDate={processedDate}
        onConfirm={(reason) => { onStart(routine.id, reason); setConfirmStart(false); }}
      />
      <RoutineSheet
        open={editing}
        onOpenChange={setEditing}
        period={routine.period}
        routine={routine}
        groups={groups}
        onAdd={() => {}}
        onUpdate={onUpdate}
        onCreateGroup={onCreateGroup}
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
