export type ControlPattern = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface ControlPatternInfo {
  code: ControlPattern;
  label: string;
  banco: string;
  tabela: string;
  description: string;
  needsScript: boolean;
  needsProduct: boolean;
  /** Quando o reprocessamento grava D-1 da data escolhida (rotina soma +1) */
  storesMinusOne: boolean;
}

export const CONTROL_PATTERNS: Record<ControlPattern, ControlPatternInfo> = {
  A: {
    code: 'A',
    label: 'Padrão A — Flag NULL/Data',
    banco: 'db_stage_bi',
    tabela: 'tab_controle_bi_reprocessamento',
    description: 'NULL = processamento normal, data preenchida = reprocessamento. UPDATE seta a data desejada.',
    needsScript: true,
    needsProduct: false,
    storesMinusOne: false,
  },
  B: {
    code: 'B',
    label: 'Padrão B — Última data processada',
    banco: 'db_stage_bi',
    tabela: 'tab_controle_bi',
    description: 'Rotina sempre faz D+1 sobre a última data. Para reprocessar grava D-1 da data desejada.',
    needsScript: true,
    needsProduct: false,
    storesMinusOne: true,
  },
  C: {
    code: 'C',
    label: 'Padrão C — Flag NULL/Data Moedas',
    banco: 'db_ds_moeda',
    tabela: 'tab_controle_data_processamento',
    description: 'Igual ao Padrão A, mas em banco/tabela separados.',
    needsScript: true,
    needsProduct: false,
    storesMinusOne: false,
  },
  D: {
    code: 'D',
    label: 'Padrão D — Retroceder data',
    banco: 'db_reconciliacao',
    tabela: 'tab_controle_reconciliacao',
    description: 'A rotina faz D+1 no código. Para reprocessar volta a data manualmente (grava D-1).',
    needsScript: true,
    needsProduct: false,
    storesMinusOne: true,
  },
  E: {
    code: 'E',
    label: 'Padrão E — Controle por produto ativo',
    banco: 'db_pnl',
    tabela: 'tab_grupo_produto_pnl',
    description: 'Filtro de produtos (ativo=1 processa). Restaurar todos como ativo=1 após execução.',
    needsScript: true,
    needsProduct: true,
    storesMinusOne: false,
  },
  F: {
    code: 'F',
    label: 'Padrão F — Tabela genérica nova (oficial)',
    banco: 'db_stage_bi',
    tabela: 'tab_controle_reprocessamento_global',
    description: 'Padrão oficial. dt_referencia NULL=normal, preenchida=reprocessamento. Auto-limpa ao concluir.',
    needsScript: false,
    needsProduct: false,
    storesMinusOne: false,
  },
};
