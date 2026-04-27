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
  idle:    'aguardando',
  running: 'em execução',
  success: 'concluído',
  error:   'erro',
};

const STATUS_DOT: Record<Routine['status'], string> = {
  idle:    'status-dot--idle',
  running: 'status-dot--running',
  success: 'status-dot--success',
  error:   'status-dot--error',
};

const STATUS_TEXT: Record<Routine['status'], string> = {
  idle:    'text-muted-foreground',
  running: 'text-[hsl(var(--status-running))]',
  success: 'text-muted-foreground',
  error:   'text-[hsl(var(--status-error))] font-medium',
};

export function RoutineCard({
  routine, groups, onUpdate, onDelete, onStart, onReset, onCreateGroup,
}: Props) {
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

  return (
    <div
      className={cn(
        'group relative grid items-center gap-4 px-5 py-3 text-[13px] transition-colors',
        'border-b border-border/60 last:border-b-0',
        // 6 colunas: status / identidade / padrão+banco / executável / referência / ações
        'grid-cols-[auto_minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,0.9fr)_auto]',
        'hover:bg-[hsl(var(--surface-muted))]',
        // realce sutil só quando algo precisa de atenção
        routine.status === 'running' && 'bg-[hsl(var(--status-running)/0.04)]',
        routine.status === 'error'   && 'bg-[hsl(var(--status-error)/0.04)]',
      )}
    >
      {/* STATUS — pontinho à esquerda */}
      <div className="flex items-center justify-center w-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('status-dot', STATUS_DOT[routine.status])} aria-label={STATUS_LABEL[routine.status]} />
          </TooltipTrigger>
          <TooltipContent className="text-xs capitalize">{STATUS_LABEL[routine.status]}</TooltipContent>
        </Tooltip>
      </div>

      {/* IDENTIDADE */}
      <div className="min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-[14px] text-foreground truncate">{routine.name}</span>
          {routine.reason && (
            <Tooltip>
              <TooltipTrigger asChild>
                <FileText className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">{routine.reason}</TooltipContent>
            </Tooltip>
          )}
        </div>
        {routine.cod_rotina && (
          <div className="font-tech text-[11px] text-muted-foreground/80 truncate mt-0.5">
            {routine.cod_rotina}
          </div>
        )}
      </div>

      {/* PADRÃO + BANCO */}
      <div className="min-w-0 font-tech text-[11px] leading-tight">
        <div className="text-muted-foreground">padrão {routine.tipo_controle}</div>
        <div className="text-muted-foreground/70 truncate">{routine.banco}</div>
      </div>

      {/* EXECUTÁVEL */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="font-tech text-[11px] text-muted-foreground/80 truncate cursor-default">
            {routine.exePath}
          </div>
        </TooltipTrigger>
        <TooltipContent className="text-xs font-tech max-w-md break-all">{routine.exePath}</TooltipContent>
      </Tooltip>

      {/* REFERÊNCIA + DATA */}
      <div className="min-w-0 font-tech text-[11px] leading-tight">
        <div className="text-foreground">{routine.dateReference}</div>
        <div className="text-muted-foreground/70">→ {processedDate}</div>
      </div>

      {/* AÇÕES + STATUS TEXTUAL */}
      <div className="flex items-center gap-3 justify-end shrink-0">
        <span className={cn('text-[11px] tracking-wide hidden md:inline', STATUS_TEXT[routine.status])}>
          {routine.status === 'error' && <AlertCircle className="inline h-3 w-3 mr-1 -mt-0.5" />}
          {STATUS_LABEL[routine.status]}
        </span>

        <div className="flex items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
          {/* Play */}
          {routine.status !== 'running' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => canStart && setConfirmStart(true)}
                    disabled={!canStart}
                    className={cn(
                      'h-7 w-7',
                      canStart && 'text-[hsl(var(--status-success))] hover:bg-[hsl(var(--status-success)/0.1)]',
                    )}
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
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onReset(routine.id)}
                  className="h-7 w-7 text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error)/0.1)]"
                >
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
                  className="h-7 w-7 relative text-muted-foreground hover:text-foreground"
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

          {/* Editar */}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setEditing(true)}
            disabled={actionsLocked}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
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
            className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error)/0.1)]"
            aria-label="Excluir"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Detalhe do erro */}
      {routine.status === 'error' && errorDetail && (
        <div className="col-span-full -mx-5 -mb-3 mt-2 bg-[hsl(var(--status-error)/0.06)] border-t border-[hsl(var(--status-error)/0.2)]">
          <Collapsible open={errorDetailOpen} onOpenChange={setErrorDetailOpen}>
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-5 py-1.5 text-left text-[11px] font-medium text-[hsl(var(--status-error))] hover:bg-[hsl(var(--status-error)/0.08)]">
              <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', errorDetailOpen && 'rotate-180')} />
              detalhe do erro
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-5 pb-2 pt-1 text-[12px] leading-relaxed text-[hsl(var(--status-error))] whitespace-pre-wrap font-tech">
                {errorDetail}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* Histórico inline */}
      {showHistory && routine.history.length > 0 && (
        <div className="col-span-full -mx-5 -mb-3 mt-2 bg-[hsl(var(--surface-muted))] border-t border-border px-5 py-2">
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

      <RoutineSheet
        open={editing}
        onOpenChange={setEditing}
        period={routine.period}
        routine={routine}
        groups={groups}
        onAdd={() => { /* edição não usa onAdd */ }}
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
