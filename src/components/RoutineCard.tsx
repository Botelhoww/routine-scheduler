import { useState } from 'react';
import { Routine, DateReference } from '@/types/routine';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from './StatusBadge';
import { ConfirmReprocessDialog } from './ConfirmReprocessDialog';
import { ConfirmDialog } from './ConfirmDialog';
import { InlineHistory } from './InlineHistory';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Play, Pencil, Trash2, FolderOpen, Save, X, Info, FileText, History } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const dateRefLabels: Record<DateReference, string> = {
  'D-1': 'Dia anterior à data selecionada',
  'D0': 'A própria data selecionada',
  'D+1': 'Dia seguinte à data selecionada',
};

interface Props {
  routine: Routine;
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onDelete: (id: string) => void;
  onStart: (id: string, reason?: string) => void;
}

export function RoutineCard({ routine, onUpdate, onDelete, onStart }: Props) {
  const [editing, setEditing] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editName, setEditName] = useState(routine.name);
  const [editExe, setEditExe] = useState(routine.exePath);
  const [editDate, setEditDate] = useState(routine.reprocessDate);
  const [editRef, setEditRef] = useState<DateReference>(routine.dateReference);
  const [editReason, setEditReason] = useState(routine.reason || '');

  const processedDate = calculateProcessingDate(routine.reprocessDate, routine.dateReference);
  const isExeValid = routine.exePath.toLowerCase().endsWith('.exe');
  const canStart = isExeValid && routine.reprocessDate && routine.status !== 'running';

  const disabledReason = !routine.reprocessDate
    ? 'Selecione uma data antes de iniciar'
    : !isExeValid
    ? 'Caminho do .exe inválido'
    : routine.status === 'running'
    ? 'Rotina já em execução'
    : '';

  const handleSave = () => {
    if (!editExe.toLowerCase().endsWith('.exe')) return;
    onUpdate(routine.id, { name: editName, exePath: editExe, reprocessDate: editDate, dateReference: editRef, reason: editReason || undefined });
    setEditing(false);
  };

  const handleCancel = () => {
    setEditName(routine.name);
    setEditExe(routine.exePath);
    setEditDate(routine.reprocessDate);
    setEditRef(routine.dateReference);
    setEditReason(routine.reason || '');
    setEditing(false);
  };

  const startButton = (
    <Button
      size="sm"
      onClick={() => canStart && setConfirmStart(true)}
      disabled={!canStart}
      className="bg-success text-success-foreground hover:bg-success/90 gap-1.5 text-xs"
    >
      <Play className="h-3.5 w-3.5" /> Iniciar
    </Button>
  );

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              {editing ? (
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="font-semibold text-sm mb-2" />
              ) : (
                <h3 className="font-semibold text-foreground truncate">{routine.name}</h3>
              )}
            </div>
            <StatusBadge status={routine.status} />
          </div>

          {routine.status === 'error' && routine.errorMessage && (
            <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1 mb-3">{routine.errorMessage}</p>
          )}

          {editing ? (
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground">Caminho do executável</Label>
                <div className="relative">
                  <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={editExe} onChange={e => setEditExe(e.target.value)}
                    className={cn("pl-9 text-xs font-mono", !editExe.toLowerCase().endsWith('.exe') && editExe && 'border-destructive')}
                    placeholder="C:\caminho\rotina.exe"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Data de reprocessamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal text-xs">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editDate ? format(new Date(editDate + 'T12:00:00'), 'dd/MM/yyyy') : 'Selecionar data'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDate ? new Date(editDate + 'T12:00:00') : undefined}
                      onSelect={d => d && setEditDate(d.toISOString().split('T')[0])}
                      disabled={d => d > new Date()}
                      locale={ptBR}
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Label className="text-xs text-muted-foreground">Referência de data</Label>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">
                      <p><strong>D-1:</strong> Dia útil anterior.</p>
                      <p><strong>D0:</strong> Data corrente.</p>
                      <p><strong>D+1:</strong> Próximo dia.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex gap-1.5">
                  {(['D-1', 'D0', 'D+1'] as DateReference[]).map(ref => (
                    <Button key={ref} variant={editRef === ref ? 'default' : 'outline'} size="sm" className="flex-1 text-xs" onClick={() => setEditRef(ref)}>
                      {ref}
                    </Button>
                  ))}
                </div>
                {editDate && (
                  <p className="text-xs text-muted-foreground mt-1.5">→ Será processado com: <strong>{calculateProcessingDate(editDate, editRef)}</strong></p>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Motivo do reprocessamento (opcional)</Label>
                <Textarea
                  value={editReason}
                  onChange={e => setEditReason(e.target.value.slice(0, 200))}
                  placeholder="Descreva o motivo..."
                  className="mt-1 text-xs min-h-[60px]"
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right mt-0.5">{editReason.length}/200</p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSave} className="bg-success text-success-foreground hover:bg-success/90 gap-1">
                  <Save className="h-3.5 w-3.5" /> Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} className="gap-1">
                  <X className="h-3.5 w-3.5" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="font-mono truncate">{routine.exePath}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Data: <strong className="text-foreground">{new Date(routine.reprocessDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong></span>
                  <span>Ref: <strong className="text-foreground">{routine.dateReference}</strong></span>
                </div>
                <p>→ Processado com: <strong className="text-foreground">{processedDate}</strong></p>
                {routine.reason && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5 cursor-default">
                        <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{routine.reason}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs text-xs">{routine.reason}</TooltipContent>
                  </Tooltip>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {!canStart ? (
                    <Tooltip>
                      <TooltipTrigger asChild>{startButton}</TooltipTrigger>
                      <TooltipContent className="text-xs">{disabledReason || 'Preencha todos os campos antes de iniciar'}</TooltipContent>
                    </Tooltip>
                  ) : startButton}
                  <Button size="sm" variant="ghost" onClick={() => setEditing(true)} disabled={routine.status === 'running'}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={routine.status === 'running'} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                {routine.history.length > 0 && (
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground text-xs" onClick={() => setShowHistory(v => !v)}>
                    <History className="h-3.5 w-3.5" />
                    Histórico ({routine.history.length})
                  </Button>
                )}
              </div>

              {showHistory && (
                <InlineHistory history={routine.history} onClose={() => setShowHistory(false)} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmReprocessDialog
        open={confirmStart}
        onOpenChange={setConfirmStart}
        routine={routine}
        processedDate={processedDate}
        onConfirm={(reason) => { onStart(routine.id, reason); setConfirmStart(false); }}
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
