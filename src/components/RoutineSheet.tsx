import { useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { Routine, DateReference, RoutinePeriod, ControlPattern } from '@/types/routine';
import { CONTROL_PATTERNS } from '@/types/control-pattern';
import { calculateProcessingDate } from '@/hooks/useRoutines';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FolderOpen, CalendarIcon, Info, AlertTriangle, FolderPlus } from 'lucide-react';
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
      setDate('');
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
        className="w-[480px] sm:max-w-[480px] p-0 flex flex-col gap-0 overflow-hidden"
      >
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="text-[15px]">{isEdit ? 'Editar Rotina' : 'Nova Rotina'}</SheetTitle>
          <SheetDescription className="text-xs">
            {isEdit
              ? 'Atualize os dados desta rotina. As mudanças entram em vigor após salvar.'
              : 'Cadastre uma nova rotina no período selecionado.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Nome */}
          <div>
            <Label className="text-xs">Nome da rotina <span className="text-destructive">*</span></Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value.slice(0, 120))}
              placeholder="Ex: Fechamento de Posições"
              className="mt-1.5"
            />
            {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
          </div>

          {/* Código */}
          <div>
            <Label className="text-xs">Código da rotina <span className="text-destructive">*</span></Label>
            <Input
              value={codRotina}
              onChange={e => setCodRotina(e.target.value.toUpperCase().slice(0, 60))}
              placeholder="PMAD0001_01"
              className="mt-1.5 font-mono text-sm"
            />
            {errors.cod_rotina && <p className="text-[11px] text-destructive mt-1">{errors.cod_rotina}</p>}
          </div>

          {/* Grupo */}
          <div>
            <Label className="text-xs">Grupo <span className="text-destructive">*</span></Label>
            <Select value={grupoSelect} onValueChange={setGrupoSelect}>
              <SelectTrigger className="mt-1.5">
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
            {errors.grupoSigla && <p className="text-[11px] text-destructive mt-1">{errors.grupoSigla}</p>}

            {isCreatingNewGroup && (
              <div className="mt-2 grid grid-cols-[110px_1fr] gap-2">
                <div>
                  <Input
                    value={novoSigla}
                    onChange={e => setNovoSigla(e.target.value.toUpperCase().slice(0, 8))}
                    placeholder="SIGLA"
                    className="font-mono text-sm uppercase"
                    maxLength={8}
                  />
                  {errors.novoSigla && <p className="text-[11px] text-destructive mt-1">{errors.novoSigla}</p>}
                </div>
                <div>
                  <Input
                    value={novoNome}
                    onChange={e => setNovoNome(e.target.value.slice(0, 80))}
                    placeholder="Nome descritivo do grupo"
                    className="text-sm"
                  />
                  {errors.novoNome && <p className="text-[11px] text-destructive mt-1">{errors.novoNome}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Caminho do .exe */}
          <div>
            <Label className="text-xs">Caminho do executável <span className="text-destructive">*</span></Label>
            <div className="relative mt-1.5">
              <FolderOpen className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={exePath}
                onChange={e => setExePath(e.target.value.slice(0, 260))}
                className={cn('pl-9 font-mono text-sm', exeInvalid && 'border-destructive')}
                placeholder="C:\caminho\rotina.exe"
              />
            </div>
            {exeInvalid && <p className="text-[11px] text-destructive mt-1">O caminho deve terminar em .exe</p>}
            {errors.exePath && !exeInvalid && <p className="text-[11px] text-destructive mt-1">{errors.exePath}</p>}
          </div>

          {/* Referência (radio buttons estilizados) */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <Label className="text-xs">Referência de data <span className="text-destructive">*</span></Label>
              <Tooltip>
                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-xs text-xs">
                  <p><strong>D-1:</strong> Dia útil anterior.</p>
                  <p><strong>D0:</strong> Data corrente.</p>
                  <p><strong>D+1:</strong> Próximo dia.</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <div role="radiogroup" className="grid grid-cols-3 gap-2">
              {(['D-1', 'D0', 'D+1'] as DateReference[]).map(ref => {
                const active = dateRef === ref;
                return (
                  <button
                    key={ref}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setDateRef(ref)}
                    className={cn(
                      'h-9 rounded-md border text-sm font-mono font-medium transition-colors',
                      active
                        ? 'bg-[#0A2540] text-white border-[#0A2540]'
                        : 'bg-white text-[#444] border-[#E2E4E8] hover:bg-[#F0F2F5]',
                    )}
                  >
                    {ref}
                  </button>
                );
              })}
            </div>
            {date && (
              <p className="text-xs text-muted-foreground mt-2">
                → Será processado com:{' '}
                <strong className="text-foreground">{calculateProcessingDate(date, dateRef)}</strong>
              </p>
            )}
          </div>

          {/* Data */}
          <div>
            <Label className="text-xs">Data de reprocessamento <span className="text-destructive">*</span></Label>
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
            {errors.reprocessDate && <p className="text-[11px] text-destructive mt-1">{errors.reprocessDate}</p>}
          </div>

          {/* Tipo de controle */}
          <div>
            <Label className="text-xs">Tipo de controle <span className="text-destructive">*</span></Label>
            <Select value={tipoControle} onValueChange={v => setTipoControle(v as ControlPattern)}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PATTERNS.map(p => (
                  <SelectItem key={p} value={p}>{CONTROL_PATTERNS[p].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground mt-1.5">{info.description}</p>
          </div>

          {/* Banco / Tabela (read-only) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Banco</Label>
              <Input value={info.banco} readOnly className="mt-1.5 font-mono text-xs bg-muted" />
            </div>
            <div>
              <Label className="text-xs">Tabela de controle</Label>
              <Input value={info.tabela} readOnly className="mt-1.5 font-mono text-xs bg-muted" />
            </div>
          </div>

          {/* Padrão E: produto + alerta laranja */}
          {info.needsProduct && (
            <div>
              <Label className="text-xs">Produto a reprocessar <span className="text-destructive">*</span></Label>
              <Input
                value={produto}
                onChange={e => setProduto(e.target.value.slice(0, 120))}
                placeholder="Ex: SWAP_DI"
                className="mt-1.5 text-sm"
              />
              {errors.produto && <p className="text-[11px] text-destructive mt-1">{errors.produto}</p>}
              <div className="flex items-start gap-1.5 mt-2 text-xs bg-warning/10 text-warning-foreground border border-warning/40 rounded p-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning mt-0.5" />
                <span>Lembre-se de restaurar todos os produtos como ativo=1 após a execução.</span>
              </div>
            </div>
          )}

          {/* Padrões A/B/C/D/E: script de preparação */}
          {info.needsScript && (
            <div>
              <Label className="text-xs">
                Script de preparação <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                value={scriptPrep}
                onChange={e => setScriptPrep(e.target.value.slice(0, 500))}
                placeholder={`UPDATE ${info.banco}.dbo.${info.tabela} SET ...`}
                className="mt-1.5 text-xs font-mono min-h-[80px]"
                maxLength={500}
              />
              <p className="text-[11px] text-muted-foreground text-right mt-0.5">{scriptPrep.length}/500</p>
              {errors.scriptPrep && <p className="text-[11px] text-destructive mt-1">{errors.scriptPrep}</p>}
            </div>
          )}

          {/* Motivo */}
          <div>
            <Label className="text-xs">
              Motivo do reprocessamento <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              value={reason}
              onChange={e => setReason(e.target.value.slice(0, 200))}
              placeholder="Descreva o motivo..."
              className="mt-1.5 text-sm min-h-[60px]"
              maxLength={200}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-0.5">{reason.length}/200</p>
          </div>
        </div>

        {/* Rodapé */}
        <div className="border-t border-border px-5 py-3 flex items-center justify-end gap-2 bg-card">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!validation.ok}
            className="bg-[#E30613] hover:bg-[#c70512] text-white"
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
