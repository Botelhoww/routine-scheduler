import { useState } from 'react';
import { DateReference, RoutinePeriod } from '@/types/routine';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, FolderOpen, CalendarIcon, Info } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Props {
  period: RoutinePeriod;
  onAdd: (routine: { name: string; exePath: string; reprocessDate: string; dateReference: DateReference; period: RoutinePeriod; reason?: string }) => void;
}

export function AddRoutineDrawer({ period, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [exePath, setExePath] = useState('');
  const [date, setDate] = useState('');
  const [dateRef, setDateRef] = useState<DateReference>('D0');
  const [reason, setReason] = useState('');

  const isValid = name.trim() && exePath.toLowerCase().endsWith('.exe') && date;

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({ name: name.trim(), exePath, reprocessDate: date, dateReference: dateRef, period, reason: reason || undefined });
    setName(''); setExePath(''); setDate(''); setDateRef('D0'); setReason('');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs border-dashed">
          <Plus className="h-3.5 w-3.5" /> Adicionar Rotina
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nova Rotina</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 mt-6">
          <div>
            <Label>Nome da Rotina</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Fechamento de Posições" className="mt-1.5" />
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
