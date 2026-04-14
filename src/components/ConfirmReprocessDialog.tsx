import { useState, useMemo } from 'react';
import { Routine } from '@/types/routine';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: Routine;
  processedDate: string;
  onConfirm: (reason?: string) => void;
}

export function ConfirmReprocessDialog({ open, onOpenChange, routine, processedDate, onConfirm }: Props) {
  const [typedName, setTypedName] = useState('');
  const [reason, setReason] = useState(routine.reason || '');
  const isMatch = typedName.trim().toLowerCase() === routine.name.trim().toLowerCase();
  const now = useMemo(() => new Date(), [open]);

  const handleClose = (v: boolean) => {
    if (!v) setTypedName('');
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Reprocessamento</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <div className="bg-muted rounded-lg p-3 space-y-1.5 text-xs">
                <p><strong>Rotina:</strong> {routine.name}</p>
                <p><strong>Executável:</strong> <span className="font-mono">{routine.exePath}</span></p>
                <p><strong>Data selecionada:</strong> {new Date(routine.reprocessDate + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                <p><strong>Referência:</strong> {routine.dateReference}</p>
                <p><strong>Data calculada:</strong> {processedDate}</p>
              </div>

              <div>
                <Label className="text-xs">Motivo do reprocessamento (opcional)</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value.slice(0, 200))}
                  placeholder="Descreva o motivo..."
                  className="mt-1 text-xs min-h-[50px]"
                  maxLength={200}
                />
              </div>

              <div>
                <Label className="text-xs text-foreground font-medium">
                  Digite o nome da rotina para confirmar: <strong>"{routine.name}"</strong>
                </Label>
                <Input
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder={routine.name}
                  className="mt-1 text-sm"
                  autoFocus
                />
              </div>

              <p className="text-xs text-muted-foreground border-t border-border pt-2">
                Executado por: <strong>João Silva</strong> — {now.toLocaleDateString('pt-BR')} {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setTypedName('')}>Cancelar</AlertDialogCancel>
          <Button
            disabled={!isMatch}
            onClick={() => { onConfirm(reason || undefined); setTypedName(''); }}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            Confirmar Reprocessamento
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
