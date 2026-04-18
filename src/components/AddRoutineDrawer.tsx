import { useState, useMemo } from 'react';
import { DateReference, RoutinePeriod, ControlPattern } from '@/types/routine';
import { CONTROL_PATTERNS } from '@/types/control-pattern';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FolderOpen, CalendarIcon, Info, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AddPayload {
  name: string;
  exePath: string;
  reprocessDate: string;
  dateReference: DateReference;
  period: RoutinePeriod;
  reason?: string;
  tipo_controle: ControlPattern;
  cod_rotina?: string;
  grupo?: string;
  script_preparacao?: string;
  produto_reprocessar?: string;
}

interface Props {
  period: RoutinePeriod;
  onAdd: (routine: AddPayload) => void;
}

const PATTERNS: ControlPattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];

export function AddRoutineDrawer({ period, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [codRotina, setCodRotina] = useState('');
  const [grupo, setGrupo] = useState('');
  const [exePath, setExePath] = useState('');
  const [date, setDate] = useState('');
  const [dateRef, setDateRef] = useState<DateReference>('D0');
  const [reason, setReason] = useState('');
  const [tipoControle, setTipoControle] = useState<ControlPattern>('F');
  const [scriptPrep, setScriptPrep] = useState('');
  const [produto, setProduto] = useState('');

  const info = useMemo(() => CONTROL_PATTERNS[tipoControle], [tipoControle]);
  const isValid = name.trim() && exePath.toLowerCase().endsWith('.exe') && date && (!info.needsProduct || produto.trim());

  const reset = () => {
    setName(''); setCodRotina(''); setGrupo(''); setExePath('');
    setDate(''); setDateRef('D0'); setReason('');
    setTipoControle('F'); setScriptPrep(''); setProduto('');
  };

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      name: name.trim(), exePath, reprocessDate: date, dateReference: dateRef, period,
      reason: reason || undefined,
      tipo_controle: tipoControle,
      cod_rotina: codRotina || undefined,
      grupo: grupo || undefined,
      script_preparacao: info.needsScript && scriptPrep ? scriptPrep : undefined,
      produto_reprocessar: info.needsProduct ? produto : undefined,
    });
    reset();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-dashed">
          <Plus className="h-3.5 w-3.5" /> Adicionar Rotina
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Nova Rotina</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Código</Label>
              <Input value={codRotina} onChange={e => setCodRotina(e.target.value)} placeholder="PMAD0001_01" className="mt-1.5 font-mono text-sm" />
            </div>
            <div>
              <Label>Grupo</Label>
              <Input value={grupo} onChange={e => setGrupo(e.target.value)} placeholder="SPB / BCT / PNL / BI / BACEN" className="mt-1.5 text-sm" />
            </div>
          </div>

          <div>
            <Label>Nome da Rotina</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fechamento de Posições" className="mt-1.5" />
          </div>

          <div>
            <Label>Tipo de Controle</Label>
            <Select value={tipoControle} onValueChange={v => setTipoControle(v as ControlPattern)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERNS.map(p => (
                  <SelectItem key={p} value={p}>{CONTROL_PATTERNS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1.5">{info.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Banco</Label>
              <Input value={info.banco} readOnly className="mt-1.5 font-mono text-xs bg-muted" />
            </div>
            <div>
              <Label>Tabela de controle</Label>
              <Input value={info.tabela} readOnly className="mt-1.5 font-mono text-xs bg-muted" />
            </div>
          </div>

          <div>
            <Label>Caminho do executável</Label>
            <div className="relative mt-1.5">
              <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={exePath} onChange={e => setExePath(e.target.value)}
                className={cn("pl-9 font-mono text-sm", exePath && !exePath.toLowerCase().endsWith('.exe') && 'border-destructive')}
                placeholder="C:\caminho\rotina.exe"
              />
            </div>
            {exePath && !exePath.toLowerCase().endsWith('.exe') && (
              <p className="text-xs text-destructive mt-1">O caminho deve terminar em .exe</p>
            )}
          </div>

          <div>
            <Label>Data de reprocessamento</Label>
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
              <Label>Referência de data</Label>
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
              <p className="text-sm text-muted-foreground mt-2">→ Será processado com: <strong className="text-foreground">{calculateProcessingDate(date, dateRef)}</strong></p>
            )}
          </div>

          {info.needsScript && (
            <div>
              <Label>Script de preparação <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <Textarea
                value={scriptPrep}
                onChange={e => setScriptPrep(e.target.value)}
                placeholder={`UPDATE ${info.banco}.dbo.${info.tabela} SET ...`}
                className="mt-1.5 text-xs font-mono min-h-[80px]"
              />
            </div>
          )}

          {info.needsProduct && (
            <div>
              <Label>Produto a reprocessar</Label>
              <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: SWAP_DI" className="mt-1.5 text-sm" />
              <div className="flex items-start gap-1.5 mt-2 text-xs bg-warning/10 text-warning-foreground border border-warning/40 rounded p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning mt-0.5" />
                <span>Atenção: restaurar todos os produtos como ativo=1 após a execução.</span>
              </div>
            </div>
          )}

          <div>
            <Label>Motivo do reprocessamento (opcional)</Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, 200))}
              placeholder="Descreva o motivo..."
              className="mt-1.5 text-sm min-h-[60px]"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{reason.length}/200</p>
          </div>

          <Button onClick={handleSubmit} disabled={!isValid} className="w-full bg-success text-success-foreground hover:bg-success/90">
            Adicionar Rotina
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
