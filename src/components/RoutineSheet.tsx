import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Routine, DateReference, RoutinePeriod, ControlPattern } from '@/types/routine';
import { CONTROL_PATTERNS } from '@/types/control-pattern';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, CalendarIcon, AlertTriangle, FolderPlus, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const PATTERNS: ControlPattern[] = ['A', 'B', 'C', 'D', 'E', 'F'];
const NEW_GROUP_VALUE = '__new__';

const baseSchema = z.object({
  name: z.string().trim().min(1, 'Informe o nome').max(120, 'Máx 120 caracteres'),
  cod_rotina: z.string().trim().min(1, 'Informe o código').max(60, 'Máx 60 caracteres'),
  exePath: z
    .string()
    .trim()
    .min(1, 'Informe o caminho do executável')
    .max(260, 'Máx 260 caracteres')
    .refine(v => v.toLowerCase().endsWith('.exe'), 'O caminho deve terminar em .exe'),
  reprocessDate: z.string().min(1, 'Selecione uma data'),
  grupoSigla: z.string().trim().min(1, 'Selecione um grupo').max(8, 'Sigla máx 8 chars'),
  produto: z.string().trim().max(120).optional(),
  scriptPrep: z.string().max(500, 'Script máx 500 caracteres').optional(),
  reason: z.string().max(200, 'Motivo máx 200 caracteres').optional(),
});

export interface GroupOption {
  sigla: string;
  name: string;
}

interface SaveAddPayload {
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Período atual (relevante apenas em modo criação) */
  period: RoutinePeriod;
  /** Quando preenchida → modo edição */
  routine?: Routine;
  /** Grupos disponíveis para seleção */
  groups: GroupOption[];
  /** Callbacks */
  onAdd: (payload: SaveAddPayload) => void;
  onUpdate: (id: string, updates: Partial<Routine>) => void;
  onCreateGroup: (sigla: string, name: string) => void;
}

export function RoutineSheet({
  open, onOpenChange,
  period, routine, groups,
  onAdd, onUpdate, onCreateGroup,
}: Props) {
  const isEdit = !!routine;

  // ----- form state -----
  const [name, setName] = useState('');
  const [codRotina, setCodRotina] = useState('');
  const [exePath, setExePath] = useState('');
  const [date, setDate] = useState('');
  const [dateRef, setDateRef] = useState<DateReference>('D0');
  const [reason, setReason] = useState('');
  const [tipoControle, setTipoControle] = useState<ControlPattern>('F');
  const [scriptPrep, setScriptPrep] = useState('');
  const [produto, setProduto] = useState('');

  // grupo: select (sigla) + (se "novo grupo") sigla nova + nome
  const [grupoSelect, setGrupoSelect] = useState<string>('');
  const [novoSigla, setNovoSigla] = useState('');
  const [novoNome, setNovoNome] = useState('');

  // erros locais (form-level)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ----- reset/seed quando abre -----
  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (routine) {
      setName(routine.name);
      setCodRotina(routine.cod_rotina ?? '');
      setExePath(routine.exePath);
      setDate(routine.reprocessDate);
      setDateRef(routine.dateReference);
      setReason(routine.reason ?? '');
      setTipoControle(routine.tipo_controle);
      setScriptPrep(routine.script_preparacao ?? '');
      setProduto(routine.produto_reprocessar ?? '');
      setGrupoSelect(routine.grupo ?? '');
      setNovoSigla('');
      setNovoNome('');
    } else {
      setName('');
      setCodRotina('');
      setExePath('');
      // Padrão: data de hoje
      setDate(new Date().toISOString().split('T')[0]);
      setDateRef('D0');
      setReason('');
      setTipoControle('F');
      setScriptPrep('');
      setProduto('');
      setGrupoSelect(groups[0]?.sigla ?? '');
      setNovoSigla('');
      setNovoNome('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, routine?.id]);

  const info = useMemo(() => CONTROL_PATTERNS[tipoControle], [tipoControle]);

  const isCreatingNewGroup = grupoSelect === NEW_GROUP_VALUE;

  /** Sigla efetiva do grupo (depois de eventual criação) */
  const effectiveGrupoSigla = isCreatingNewGroup
    ? novoSigla.trim().toUpperCase()
    : grupoSelect;

  // validação reativa para habilitar botão
  const validation = useMemo(() => {
    const result = baseSchema.safeParse({
      name,
      cod_rotina: codRotina,
      exePath,
      reprocessDate: date,
      grupoSigla: effectiveGrupoSigla,
      produto: produto || undefined,
      scriptPrep: scriptPrep || undefined,
      reason: reason || undefined,
    });
    if (!result.success) return { ok: false as const, errors: flattenZod(result.error) };
    if (info.needsProduct && !produto.trim()) {
      return { ok: false as const, errors: { produto: 'Informe o produto a reprocessar' } };
    }
    if (isCreatingNewGroup) {
      if (!novoSigla.trim()) return { ok: false as const, errors: { novoSigla: 'Informe a sigla' } };
      if (!novoNome.trim()) return { ok: false as const, errors: { novoNome: 'Informe o nome' } };
    }
    return { ok: true as const };
  }, [name, codRotina, exePath, date, effectiveGrupoSigla, produto, scriptPrep, reason, info.needsProduct, isCreatingNewGroup, novoSigla, novoNome]);

  const handleSave = () => {
    if (!validation.ok) {
      setErrors(validation.errors);
      return;
    }
    setErrors({});

    // Cria grupo se necessário
    if (isCreatingNewGroup) {
      onCreateGroup(novoSigla.trim().toUpperCase(), novoNome.trim());
    }

    if (isEdit && routine) {
      onUpdate(routine.id, {
        name: name.trim(),
        cod_rotina: codRotina.trim().toUpperCase(),
        exePath: exePath.trim(),
        reprocessDate: date,
        dateReference: dateRef,
        reason: reason.trim() || undefined,
        tipo_controle: tipoControle,
        grupo: effectiveGrupoSigla,
        script_preparacao: info.needsScript ? (scriptPrep.trim() || undefined) : undefined,
        produto_reprocessar: info.needsProduct ? produto.trim() : undefined,
      });
    } else {
      onAdd({
        name: name.trim(),
        cod_rotina: codRotina.trim().toUpperCase() || undefined,
        exePath: exePath.trim(),
        reprocessDate: date,
        dateReference: dateRef,
        period,
        reason: reason.trim() || undefined,
        tipo_controle: tipoControle,
        grupo: effectiveGrupoSigla || undefined,
        script_preparacao: info.needsScript && scriptPrep.trim() ? scriptPrep.trim() : undefined,
        produto_reprocessar: info.needsProduct ? produto.trim() : undefined,
      });
    }
    onOpenChange(false);
  };

  const exeInvalid = exePath.length > 0 && !exePath.toLowerCase().endsWith('.exe');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[460px] sm:max-w-[460px] p-0 flex flex-col gap-0 overflow-hidden"
      >
        {/* Cabeçalho interno simples (sem SheetHeader duplicado) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h2 className="text-[13px] font-medium text-foreground">
            {isEdit ? 'Editar rotina' : 'Nova rotina'}
          </h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-3 space-y-2.5">
          {/* Nome */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Nome <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 120))}
              placeholder="Ex: Fechamento de Posições"
              className="h-8 mt-1 text-[12.5px]"
            />
            {errors.name && <p className="text-[10.5px] text-destructive mt-0.5">{errors.name}</p>}
          </div>

          {/* Código */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Código <span className="text-destructive">*</span></Label>
            <Input
              value={codRotina}
              onChange={e => setCodRotina(e.target.value.toUpperCase().slice(0, 60))}
              placeholder="PMAD0001_01"
              className="h-8 mt-1 font-mono text-[12.5px]"
            />
            {errors.cod_rotina && <p className="text-[10.5px] text-destructive mt-0.5">{errors.cod_rotina}</p>}
          </div>

          {/* Grupo */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Grupo <span className="text-destructive">*</span></Label>
            <Select value={grupoSelect} onValueChange={setGrupoSelect}>
              <SelectTrigger className="h-8 mt-1 text-[12.5px]">
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {groups.map(g => (
                  <SelectItem key={g.sigla} value={g.sigla}>
                    <span className="font-mono mr-2">{g.sigla}</span>
                    <span className="text-muted-foreground">— {g.name}</span>
                  </SelectItem>
                ))}
                <SelectItem value={NEW_GROUP_VALUE}>
                  <span className="flex items-center gap-1.5 text-primary">
                    <FolderPlus className="h-3.5 w-3.5" /> + Novo grupo
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.grupoSigla && <p className="text-[10.5px] text-destructive mt-0.5">{errors.grupoSigla}</p>}

            {isCreatingNewGroup && (
              <div className="mt-1.5 grid grid-cols-[100px_1fr] gap-2">
                <div>
                  <Input
                    value={novoSigla}
                    onChange={e => setNovoSigla(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="SIGLA"
                    className="h-8 font-mono text-[12.5px] uppercase"
                    maxLength={8}
                  />
                  {errors.novoSigla && <p className="text-[10.5px] text-destructive mt-0.5">{errors.novoSigla}</p>}
                </div>
                <div>
                  <Input
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value.slice(0, 80))}
                    placeholder="Nome do grupo"
                    className="h-8 text-[12.5px]"
                  />
                  {errors.novoNome && <p className="text-[10.5px] text-destructive mt-0.5">{errors.novoNome}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Caminho .exe */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Executável <span className="text-destructive">*</span></Label>
            <div className="relative mt-1">
              <FolderOpen className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={exePath}
                onChange={e => setExePath(e.target.value.slice(0, 260))}
                className={cn('h-8 pl-7 font-mono text-[12.5px]', exeInvalid && 'border-destructive')}
                placeholder="C:\caminho\rotina.exe"
              />
            </div>
            {exeInvalid && <p className="text-[10.5px] text-destructive mt-0.5">O caminho deve terminar em .exe</p>}
            {errors.exePath && !exeInvalid && <p className="text-[10.5px] text-destructive mt-0.5">{errors.exePath}</p>}
          </div>

          {/* Data */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Data <span className="text-destructive">*</span></Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-8 mt-1 justify-start text-left font-normal text-[12.5px]">
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
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
            {errors.reprocessDate && <p className="text-[10.5px] text-destructive mt-0.5">{errors.reprocessDate}</p>}
          </div>

          {/* Tipo de controle */}
          <div>
            <Label className="text-[11px] text-muted-foreground">Tipo de controle <span className="text-destructive">*</span></Label>
            <Select value={tipoControle} onValueChange={v => setTipoControle(v as ControlPattern)}>
              <SelectTrigger className="h-8 mt-1 text-[12.5px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERNS.map(p => (
                  <SelectItem key={p} value={p}>{CONTROL_PATTERNS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10.5px] text-muted-foreground mt-1 leading-snug">{info.description}</p>
          </div>

          {/* Banco / Tabela (read-only) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-muted-foreground">Banco</Label>
              <Input value={info.banco} readOnly className="h-8 mt-1 font-mono text-[11.5px] bg-muted" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground">Tabela</Label>
              <Input value={info.tabela} readOnly className="h-8 mt-1 font-mono text-[11.5px] bg-muted" />
            </div>
          </div>

          {/* Padrão E: produto + alerta */}
          {info.needsProduct && (
            <div>
              <Label className="text-[11px] text-muted-foreground">Produto a reprocessar <span className="text-destructive">*</span></Label>
              <Input
                value={produto}
                onChange={e => setProduto(e.target.value.slice(0, 120))}
                placeholder="Ex: SWAP_DI"
                className="h-8 mt-1 text-[12.5px]"
              />
              {errors.produto && <p className="text-[10.5px] text-destructive mt-0.5">{errors.produto}</p>}
              <div className="flex items-start gap-1.5 mt-1.5 text-[11px] bg-warning/10 text-warning-foreground border border-warning/40 rounded p-1.5">
                <AlertTriangle className="h-3 w-3 shrink-0 text-warning mt-0.5" />
                <span>Restaure todos os produtos como ativo=1 após a execução.</span>
              </div>
            </div>
          )}

          {/* Script (opcional) */}
          {info.needsScript && (
            <div>
              <Label className="text-[11px] text-muted-foreground">
                Script <span className="text-muted-foreground/60 font-normal">(opcional)</span>
              </Label>
              <Textarea
                value={scriptPrep}
                onChange={e => setScriptPrep(e.target.value.slice(0, 500))}
                placeholder={`UPDATE ${info.banco}.dbo.${info.tabela} SET ...`}
                className="mt-1 text-[11.5px] font-mono min-h-[60px]"
                maxLength={500}
              />
              {errors.scriptPrep && <p className="text-[10.5px] text-destructive mt-0.5">{errors.scriptPrep}</p>}
            </div>
          )}

          {/* Motivo */}
          <div>
            <Label className="text-[11px] text-muted-foreground">
              Motivo <span className="text-muted-foreground/60 font-normal">(opcional)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, 200))}
              placeholder="Descreva o motivo..."
              className="mt-1 text-[12.5px] min-h-[44px]"
              maxLength={200}
            />
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-border px-4 py-2.5 flex items-center justify-end gap-2 bg-card">
          <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!validation.ok}
            className="h-7 text-[12px] bg-[#E30613] hover:bg-[#c70512] text-white"
          >
            Salvar
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function flattenZod(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
