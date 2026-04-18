import { useState } from 'react';
import { Routine } from '@/types/routine';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { getRoutineStartBlockedReason } from '@/lib/routine-eligibility';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { ConfirmReprocessDialog } from './ConfirmReprocessDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { EditRoutineSheet } from './EditRoutineSheet';
import { InlineHistory } from './InlineHistory';
import { Play, Pencil, Trash2, History, RotateCcw, FileText, ChevronRight } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface Props {
  routine: Routine;
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
  selected?: boolean;
  onSelectToggle?: (id: string) => void;
}

export function RoutineRow({ routine, onUpdate, onDelete, onStart, onReset, selected, onSelectToggle }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const processedDate = calculateProcessingDate(routine.reprocessDate, routine.dateReference);
  const blockedReason = getRoutineStartBlockedReason(routine);
  const canStart = !blockedReason;
  const lastRun = routine.history[0];

  const disabledReason = blockedReason ?? '';

  const startBtn = (
    <Button
      size="icon"
      variant="ghost"
      onClick={() => canStart && setConfirmStart(true)}
      disabled={!canStart}
      className={cn("h-7 w-7", canStart && "text-success hover:text-success hover:bg-success/10")}
      aria-label="Reprocessar"
    >
      <Play className="h-3.5 w-3.5" fill={canStart ? 'currentColor' : 'none'} />
    </Button>
  );

  return (
    <>
      <div
        className={cn(
          "group grid grid-cols-[auto_2.4fr_0.7fr_0.9fr_1.6fr_0.6fr_1fr_0.9fr_auto] items-center gap-3 px-4 py-2 border-b border-border/60 text-xs hover:bg-muted/40 transition-colors",
          routine.status === 'error' && 'bg-destructive/[0.03]',
          routine.status === 'running' && 'bg-info/[0.04]',
        )}
      >
        <div className="flex items-center justify-center w-8 shrink-0" onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={!!selected}
            onCheckedChange={() => onSelectToggle?.(routine.id)}
            aria-label={`Selecionar ${routine.name}`}
          />
        </div>

        {/* Código + Nome */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            {routine.cod_rotina && (
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">{routine.cod_rotina}</span>
            )}
            <span className="text-muted-foreground/60">—</span>
            <span className="font-medium text-foreground truncate">{routine.name}</span>
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
            <span className="text-[10px] text-muted-foreground">Grupo: {routine.grupo}</span>
          )}
        </div>

        {/* Padrão */}
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-mono justify-center border-primary/30 text-primary">
          Padrão {routine.tipo_controle}
        </Badge>

        {/* Banco */}
        <span className="font-mono text-[11px] text-muted-foreground truncate">{routine.banco}</span>

        {/* Exe */}
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="font-mono text-[11px] text-muted-foreground truncate cursor-default">{routine.exePath}</span>
          </TooltipTrigger>
          <TooltipContent className="text-xs font-mono">{routine.exePath}</TooltipContent>
        </Tooltip>

        {/* Ref */}
        <span className="font-mono text-[11px] text-foreground text-center">{routine.dateReference}</span>

        {/* Último processamento */}
        <span className="text-[11px] text-muted-foreground truncate">
          {lastRun ? lastRun.date : <span className="italic">nunca</span>}
        </span>

        {/* Status */}
        <div className="flex justify-start">
          <StatusBadge status={routine.status} />
        </div>

        {/* Ações */}
        <div className="flex items-center gap-0.5 justify-end">
          {!canStart ? (
            <Tooltip>
              <TooltipTrigger asChild><span>{startBtn}</span></TooltipTrigger>
              <TooltipContent className="text-xs">{disabledReason || 'Preencha todos os campos antes de iniciar'}</TooltipContent>
            </Tooltip>
          ) : startBtn}
          {routine.status === 'error' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => onReset(routine.id)} className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Resetar para AGUARDANDO</TooltipContent>
            </Tooltip>
          )}
          {routine.history.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={() => setShowHistory(v => !v)} className="h-7 w-7 relative">
                  <History className="h-3.5 w-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">
                    {routine.history.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">Histórico ({routine.history.length})</TooltipContent>
            </Tooltip>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} disabled={routine.status === 'running'} className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={routine.status === 'running'} className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {showHistory && routine.history.length > 0 && (
        <div className="bg-muted/30 border-b border-border/60 px-4 py-2">
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
    </>
  );
}

/** Cabeçalho da tabela densa — ícone de chevron para alinhar com a área de ações */
export function RoutineRowHeader({
  selectAll,
}: {
  selectAll?: {
    checked: boolean | 'indeterminate';
    onToggle: () => void;
    disabled?: boolean;
  };
}) {
  return (
    <div className="grid grid-cols-[auto_2.4fr_0.7fr_0.9fr_1.6fr_0.6fr_1fr_0.9fr_auto] items-center gap-3 px-4 py-2 border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <div className="flex items-center justify-center w-8 shrink-0">
        {selectAll ? (
          <Checkbox
            checked={selectAll.checked}
            onCheckedChange={selectAll.onToggle}
            disabled={selectAll.disabled}
            aria-label="Selecionar todas do período"
          />
        ) : (
          <span className="sr-only">Sel.</span>
        )}
      </div>
      <span>Rotina</span>
      <span className="text-center">Padrão</span>
      <span>Banco</span>
      <span>Executável</span>
      <span className="text-center">Ref.</span>
      <span>Último processamento</span>
      <span>Status</span>
      <span className="text-right flex items-center justify-end gap-1">Ações <ChevronRight className="h-3 w-3" /></span>
    </div>
  );
}
