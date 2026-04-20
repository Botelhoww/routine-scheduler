import { useEffect, useState } from 'react';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z.object({
  sigla: z.string().trim().min(1, 'Informe a sigla').max(8, 'Máx 8 caracteres'),
  name: z.string().trim().min(1, 'Informe o nome descritivo').max(80, 'Máx 80 caracteres'),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** siglas já existentes (para evitar duplicatas) */
  existingSiglas: string[];
  onCreate: (sigla: string, name: string) => void;
}

export function AddGroupDialog({ open, onOpenChange, existingSiglas, onCreate }: Props) {
  const [sigla, setSigla] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setSigla('');
      setName('');
      setError(null);
    }
  }, [open]);

  const handleCreate = () => {
    const parsed = schema.safeParse({ sigla, name });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    const finalSigla = parsed.data.sigla.toUpperCase();
    if (existingSiglas.includes(finalSigla)) {
      setError(`Já existe um grupo com a sigla "${finalSigla}"`);
      return;
    }
    onCreate(finalSigla, parsed.data.name);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Adicionar Grupo</DialogTitle>
          <DialogDescription className="text-xs">
            Crie um novo subgrupo para organizar rotinas dentro do período.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div>
            <Label className="text-xs">Sigla <span className="text-destructive">*</span></Label>
            <Input
              value={sigla}
              onChange={e => { setSigla(e.target.value.toUpperCase().slice(0, 8)); setError(null); }}
              placeholder="Ex: SPB"
              className="mt-1.5 font-mono uppercase text-sm"
              maxLength={8}
              autoFocus
            />
            <p className="text-[10px] text-muted-foreground mt-1">Máximo 8 caracteres, automaticamente em maiúsculas.</p>
          </div>

          <div>
            <Label className="text-xs">Nome descritivo <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value.slice(0, 80)); setError(null); }}
              placeholder="Ex: Sistema de Pagamentos Brasileiro"
              className="mt-1.5 text-sm"
              maxLength={80}
            />
          </div>

          {error && (
            <p className="text-[11px] text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={!sigla.trim() || !name.trim()}
            className="bg-[#E30613] hover:bg-[#c70512] text-white"
          >
            Criar Grupo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
