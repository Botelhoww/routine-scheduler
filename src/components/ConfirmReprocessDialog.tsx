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
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routine: Routine;
  /** Mantido para compatibilidade — não exibido na UI */
  processedDate?: string;
  onConfirm: (reason?: string) => void;
}

export function ConfirmReprocessDialog({ open, onOpenChange, routine, onConfirm }: Props) {
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
      <AlertDialogContent className="max-w-[440px] p-5 gap-3">
        <AlertDialogHeader className="space-y-1">
          <AlertDialogTitle className="text-[14px]">Confirmar reprocessamento</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-[12.5px]">
              <div className="bg-muted/60 rounded p-2.5 space-y-0.5">
                <p className="text-foreground font-medium">{routine.name}</p>
                <p className="text-muted-foreground text-[11.5px]">
                  Data: <span className="font-mono text-foreground">
                    {new Date(routine.reprocessDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                </p>
              </div>

              {routine.tipo_controle === 'E' && (
                <div className="bg-destructive/10 border border-destructive/40 rounded p-2 text-[11.5px] flex items-start gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                  <span>Lembre-se de restaurar todos os produtos como ativos após a execução.</span>
                </div>
              )}

              <div>
                <Label className="text-[11px] text-muted-foreground">Motivo (opcional)</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value.slice(0, 200))}
                  placeholder="Descreva o motivo..."
                  className="mt-1 text-[12px] min-h-[44px]"
                  maxLength={200}
                />
              </div>

              <div>
                <Label className="text-[11px] text-foreground">
                  Digite <strong>"{routine.name}"</strong> para confirmar
                </Label>
                <Input
                  value={typedName}
                  onChange={e => setTypedName(e.target.value)}
                  placeholder={routine.name}
                  className="mt-1 h-8 text-[12.5px]"
                  autoFocus
                />
              </div>

              <p className="text-[10.5px] text-muted-foreground border-t border-border pt-2">
                {now.toLocaleDateString('pt-BR')} {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel
            onClick={() => setTypedName('')}
            className="h-7 text-[12px] mt-0"
          >
            Cancelar
          </AlertDialogCancel>
          <Button
            size="sm"
            disabled={!isMatch}
            onClick={() => { onConfirm(reason || undefined); setTypedName(''); }}
            className="h-7 text-[12px] bg-success text-success-foreground hover:bg-success/90"
          >
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
