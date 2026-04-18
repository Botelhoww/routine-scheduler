import { useState } from 'react';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eligibleCount: number;
  skippedCount: number;
  skippedReason?: string;
  onConfirm: (reason?: string) => void;
}

export function BulkReprocessDialog({
  open,
  onOpenChange,
  eligibleCount,
  skippedCount,
  skippedReason,
  onConfirm,
}: Props) {
  const [reason, setReason] = useState('');

  const handleClose = (v: boolean) => {
    if (!v) setReason('');
    onOpenChange(v);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Reprocessar em lote</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm text-left">
              <p>
                <strong>{eligibleCount}</strong> rotina{eligibleCount !== 1 ? 's' : ''} serão enviada{eligibleCount !== 1 ? 's' : ''} para reprocessamento.
              </p>
              {skippedCount > 0 && (
                <p className="text-muted-foreground text-xs">
                  {skippedCount} rotina{skippedCount !== 1 ? 's' : ''} não {skippedCount !== 1 ? 'serão incluídas' : 'será incluída'}
                  {skippedReason ? ` (${skippedReason}).` : '.'}
                </p>
              )}
              <div>
                <Label className="text-xs">Motivo do reprocessamento (opcional, aplicado a todas)</Label>
                <Textarea
                  value={reason}
                  onChange={e => setReason(e.target.value.slice(0, 200))}
                  placeholder="Descreva o motivo..."
                  className="mt-1 text-xs min-h-[50px]"
                  maxLength={200}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setReason('')}>Cancelar</AlertDialogCancel>
          <Button
            disabled={eligibleCount === 0}
            onClick={() => { onConfirm(reason || undefined); setReason(''); }}
            className="bg-success text-success-foreground hover:bg-success/90"
          >
            Confirmar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
