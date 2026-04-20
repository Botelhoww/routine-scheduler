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
import { Play, Pencil, Trash2, History, RotateCcw, FileText, ChevronRight, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

interface Props {
  routine: Routine;
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
  onReset: (id: string) => void;
}

export function RoutineRow({ routine, onUpdate, onDelete, onStart, onReset }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [errorDetailOpen, setErrorDetailOpen] = useState(false);

  const processedDate = calculateProcessingDate(routine.reprocessDate, routine.dateReference);
  const blockedReason = getRoutineStartBlockedReason(routine);
  const canStart = !blockedReason;
  const lastRun = routine.history[0];

  const errorDetail =
    routine.errorMessage?.trim() ||
    routine.history.find(h => h.status === 'error')?.errorMessage?.trim();

  const disabledReason = blockedReason ?? '';
  const actionsLocked = routine.status === 'running';

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

  const runningSpinner = (
    <Button
      size="icon"
      variant="ghost"
      disabled
      className="h-7 w-7 text-info cursor-not-allowed opacity-100"
      aria-label="Em execução"
    >
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
    </Button>
  );

  const isRowAccent = routine.status === 'error' || routine.status === 'running';

  return (
    <>
      <div
        aria-busy={routine.status === 'running'}
        className={cn(
          "group grid grid-cols-[2.4fr_0.7fr_0.9fr_1.6fr_0.6fr_1fr_0.9fr_auto] items-center gap-3 px-4 py-2 border-b border-border/60 text-xs transition-colors",
          !isRowAccent && 'hover:bg-muted/40',
          routine.status === 'error' &&
            'bg-destructive/10 border-l-4 border-l-destructive hover:bg-destructive/[0.14]',
          routine.status === 'running' &&
            'bg-info/[0.06] border-l-4 border-l-info ring-1 ring-inset ring-info/25 hover:bg-info/[0.09]',
        )}
      >
        {/* Código + Nome */}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            {routine.status === 'running' && (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-info" aria-hidden />
            )}
            {routine.cod_rotina && (
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">{routine.cod_rotina}</span>
            )}
            <span className="text-muted-foreground/60">—</span>
            <span className="font-medium text-foreground truncate">{routine.name}</span>
            {routine.status === 'error' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 rounded p-0.5 text-destructive hover:bg-destructive/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Ver detalhe do erro"
                  >
                    <AlertCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm text-xs leading-snug">
                  {errorDetail || 'Erro na última execução (sem mensagem detalhada).'}
                </TooltipContent>
              </Tooltip>
            )}
            {routine.reason && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">{routine.reason}</TooltipContent>
              </Tooltip>
            )}
          </div>
          {routine.status === 'running' ? (
            <span className="text-[10px] font-medium text-info">Em execução… aguarde o retorno.</span>
          ) : routine.grupo ? (
            <span className="text-[10px] text-muted-foreground">Grupo: {routine.grupo}</span>
          ) : null}
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
          {routine.status === 'running' ? (
            <Tooltip>
              <TooltipTrigger asChild><span>{runningSpinner}</span></TooltipTrigger>
              <TooltipContent className="text-xs">Em execução — aguarde a conclusão.</TooltipContent>
            </Tooltip>
          ) : !canStart ? (
            <Tooltip>
              <TooltipTrigger asChild><span>{startBtn}</span></TooltipTrigger>
              <TooltipContent className="text-xs">{disabledReason || 'Preencha todos os campos antes de iniciar'}</TooltipContent>
            </Tooltip>
          ) : (
            startBtn
          )}
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
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowHistory(v => !v)}
                  disabled={actionsLocked}
                  className="h-7 w-7 relative"
                >
                  <History className="h-3.5 w-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold bg-primary text-primary-foreground rounded-full h-3.5 min-w-3.5 px-1 flex items-center justify-center">
                    {routine.history.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                {actionsLocked ? 'Disponível após o fim da execução.' : `Histórico (${routine.history.length})`}
              </TooltipContent>
            </Tooltip>
          )}
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)} disabled={actionsLocked} className="h-7 w-7">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={actionsLocked} className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {routine.status === 'error' && errorDetail && (
        <Collapsible open={errorDetailOpen} onOpenChange={setErrorDetailOpen} className="border-b border-border/60 bg-destructive/[0.06]">
          <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wide text-destructive hover:bg-destructive/10">
            <ChevronDown className={cn('h-3 w-3 shrink-0 transition-transform', errorDetailOpen && 'rotate-180')} />
            Detalhe do erro
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-3 text-[11px] leading-relaxed text-foreground whitespace-pre-wrap border-t border-destructive/15">
              {errorDetail}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

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
export function RoutineRowHeader() {
  return (
    <div className="grid grid-cols-[2.4fr_0.7fr_0.9fr_1.6fr_0.6fr_1fr_0.9fr_auto] items-center gap-3 px-4 py-2 border-b border-border bg-muted/40 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
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
