import { useState } from 'react';
import { Routine, DateReference, ControlPattern } from '@/types/routine';
import { CONTROL_PATTERNS } from '@/types/control-pattern';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, CalendarIcon, Info, AlertTriangle, Save } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PATTERNS: ControlPattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: Routine;
  onSave: (id: string, updates: Partial<Routine>) => void;
}

export function EditRoutineSheet({ open, onOpenChange, routine, onSave }: Props) {
  const [name, setName] = useState(routine.name);
  const [exePath, setExePath] = useState(routine.exePath);
  const [date, setDate] = useState(routine.reprocessDate);
  const [dateRef, setDateRef] = useState<DateReference>(routine.dateReference);
  const [reason, setReason] = useState(routine.reason || '');
  const [tipo, setTipo] = useState<ControlPattern>(routine.tipo_controle);
  const [script, setScript] = useState(routine.script_preparacao || '');
  const [produto, setProduto] = useState(routine.produto_reprocessar || '');

  const info = CONTROL_PATTERNS[tipo];
  const isValid = name.trim() && exePath.toLowerCase().endsWith('.exe') && date && (!info.needsProduct || produto.trim());

  const handleSave = () => {
    if (!isValid) return;
    onSave(routine.id, {
      name: name.trim(),
      exePath,
      reprocessDate: date,
      dateReference: dateRef,
      reason: reason || undefined,
      tipo_controle: tipo,
      script_preparacao: info.needsScript ? (script || undefined) : undefined,
      produto_reprocessar: info.needsProduct ? produto : undefined,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Editar Rotina</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div>
            <Label className="text-xs">Nome</Label>
            <Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" />
          </div>

          <div>
            <Label className="text-xs">Tipo de Controle</Label>
            <Select value={tipo} onValueChange={v => setTipo(v as ControlPattern)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERNS.map(p => (
                  <SelectItem key={p} value={p}>{CONTROL_PATTERNS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono">{info.banco} / {info.tabela}</p>
          </div>

          <div>
            <Label className="text-xs">Caminho do executável</Label>
            <div className="relative mt-1.5">
              <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={exePath} onChange={e => setExePath(e.target.value)}
                className={cn("pl-9 font-mono text-sm", exePath && !exePath.toLowerCase().endsWith('.exe') && 'border-destructive')}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Data de reprocessamento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal mt-1.5">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(new Date(date + 'T12:00:00'), 'dd/MM/yyyy') : 'Selecionar data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date ? new Date(date + 'T12:00:00') : undefined}
                  onSelect={d => d && setDate(d.toISOString().split('T')[0])}
                  disabled={d => d > new Date()}
                  locale={ptBR}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Label className="text-xs">Referência de data</Label>
              <Tooltip>
                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p><strong>D-1:</strong> Dia útil anterior.</p>
                  <p><strong>D0:</strong> Data corrente.</p>
                  <p><strong>D+1:</strong> Próximo dia.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              {(['D-1', 'D0', 'D+1'] as DateReference[]).map(ref => (
                <Button key={ref} variant={dateRef === ref ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setDateRef(ref)}>
                  {ref}
                </Button>
              ))}
            </div>
            {date && (
              <p className="text-xs text-muted-foreground mt-2">→ Será processado com: <strong className="text-foreground">{calculateProcessingDate(date, dateRef)}</strong></p>
            )}
          </div>

          {info.needsScript && (
            <div>
              <Label className="text-xs">Script de preparação (opcional)</Label>
              <Textarea
                value={script}
                onChange={e => setScript(e.target.value)}
                placeholder={`UPDATE ${info.banco}.dbo.${info.tabela} SET ...`}
                className="mt-1.5 text-xs font-mono min-h-[80px]"
              />
            </div>
          )}

          {info.needsProduct && (
            <div>
              <Label className="text-xs">Produto a reprocessar</Label>
              <Input value={produto} onChange={e => setProduto(e.target.value)} className="mt-1.5" />
              <div className="flex items-start gap-1.5 mt-2 text-xs bg-warning/10 text-warning-foreground border border-warning/40 rounded p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning mt-0.5" />
                <span>Atenção: restaurar todos os produtos como ativo=1 após a execução.</span>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs">Motivo do reprocessamento (opcional)</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, 200))}
              className="mt-1.5 text-sm min-h-[60px]"
              maxLength={200}
            />
          </div>

          <Button onClick={handleSave} disabled={!isValid} className="w-full bg-success text-success-foreground hover:bg-success/90 gap-1.5">
            <Save className="h-4 w-4" /> Salvar Alterações
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
