# Arquitetura — Reprocessamento de Rotinas · BSG Société Générale

---
---

## Visão Geral

Interface web React (primeira da organização, substituindo Razor) para reprocessamento de rotinas com datas retroativas. O operador escolhe a rotina, a data e dispara o reprocessamento com rastreabilidade completa de quem fez e quando.

**Fluxo de execução:**

```
Interface React → Autosys → Console App → API C# → SQL Server
```

---

## Estratégia:

**Camada 1 — Padrão novo (rotinas novas)**
Tabela genérica centralizada com procedure padronizada.

**Camada 2 — Adaptadores paliativos (rotinas legadas)**
Cada rotina existente mantém seu mecanismo atual. A interface conhece o padrão de cada uma e executa o script de preparação antes de disparar o `.exe`.
#
#
# Camada 1 — Tabela Genérica

**Banco:** `db_stage_bi` *(candidato futuro: criar `db_reprocessamento` dedicado)*

```sql
CREATE TABLE tab_controle_reprocessamento_global (
    id                      INT IDENTITY PRIMARY KEY,
    cod_rotina              VARCHAR(50)  NOT NULL,
    nome_rotina             VARCHAR(200) NOT NULL,
    dt_referencia           DATE         NULL,      -- NULL = normal | data = reprocessamento
    dt_ultimo_processamento DATE         NULL,
    status                  VARCHAR(20)  DEFAULT 'AGUARDANDO',
    dt_atualizacao          DATETIME     DEFAULT GETDATE(),
    usuario_atualizacao     VARCHAR(100) NULL
)
```

### Ciclo de Status

```
AGUARDANDO → EM_EXECUCAO → CONCLUIDO → AGUARDANDO
AGUARDANDO → EM_EXECUCAO → ERRO  (fica em ERRO até reset manual)
```

### Lógica de Data

| Situação | Comportamento |
|---|---|
| `dt_referencia` preenchida | Usa essa data (reprocessamento) |
| `dt_referencia` NULL | Usa `dt_ultimo_processamento + 1 dia` (processamento normal) |
| Finalizar com sucesso | Limpa `dt_referencia`, atualiza `dt_ultimo_processamento` |
| Finalizar com erro | Limpa `dt_referencia`, mantém `dt_ultimo_processamento`, status fica `ERRO` |

### Procedure — `usp_controle_reprocessamento_global`

```sql
CREATE PROCEDURE usp_controle_reprocessamento_global
    @cod_rotina         VARCHAR(50),
    @acao               VARCHAR(20),    -- 'INICIAR' ou 'FINALIZAR'
    @usuario            VARCHAR(100),
    @status_finalizacao VARCHAR(20) = NULL,  -- 'CONCLUIDO' ou 'ERRO' (só no FINALIZAR)
    @dt_processamento   DATE = NULL OUTPUT   -- retorna a data a ser usada (só no INICIAR)
AS
BEGIN
    SET NOCOUNT ON

    IF @acao = 'INICIAR'
    BEGIN
        DECLARE @dt_referencia           DATE
        DECLARE @dt_ultimo_processamento DATE

        SELECT 
            @dt_referencia           = dt_referencia,
            @dt_ultimo_processamento = dt_ultimo_processamento
        FROM tab_controle_reprocessamento_global
        WHERE cod_rotina = @cod_rotina

        IF @dt_referencia IS NOT NULL
            SET @dt_processamento = @dt_referencia
        ELSE
            SET @dt_processamento = DATEADD(DAY, 1, @dt_ultimo_processamento) -- ver dps se realmente fazer d+1


        UPDATE tab_controle_reprocessamento_global
        SET 
            status              = 'EM_EXECUCAO',
            dt_atualizacao      = GETDATE(),
            usuario_atualizacao = @usuario
        WHERE cod_rotina = @cod_rotina
    END

    ELSE IF @acao = 'FINALIZAR'
    BEGIN
        DECLARE @dt_usada DATE

        SELECT @dt_usada = ISNULL(dt_referencia, DATEADD(DAY, 1, dt_ultimo_processamento))
        FROM tab_controle_reprocessamento_global
        WHERE cod_rotina = @cod_rotina

        UPDATE tab_controle_reprocessamento_global
        SET
            status                  = CASE 
                                        WHEN ISNULL(@status_finalizacao, 'CONCLUIDO') = 'CONCLUIDO' THEN 'AGUARDANDO'
                                        ELSE 'ERRO'
                                      END,
            dt_ultimo_processamento = CASE 
                                        WHEN ISNULL(@status_finalizacao, 'CONCLUIDO') = 'CONCLUIDO' THEN @dt_usada
                                        ELSE dt_ultimo_processamento
                                      END,
            dt_referencia           = NULL,
            dt_atualizacao          = GETDATE(),
            usuario_atualizacao     = @usuario
        WHERE cod_rotina = @cod_rotina
    END
END
```

**Observações:**
- Em caso de `ERRO`, o status **não** volta para `AGUARDANDO` automaticamente

---

# Camada 2 — Padrões Legados

### Padrão A — Flag NULL / Data

| | |
|---|---|
| **Tabela** | `tab_controle_bi_reprocessamento` |
| **Banco** | `db_stage_bi` |
| **Lógica** | `NULL` = processar normal · data preenchida = reprocessar com aquela data |
| **Para reprocessar** | `UPDATE` setando a data desejada no campo |

**Rotinas:**
- MVar Operação

---

### Padrão B — Última data processada, nunca NULL

| | |
|---|---|
| **Tabela** | `tab_controle_bi` |
| **Banco** | `db_stage_bi` |
| **Lógica** | Sempre tem a última data. A rotina faz D+1 automaticamente. |
| **Para reprocessar** | `UPDATE` setando D-1 da data desejada |

**Rotinas:**
- XOne
- Interface Matutino
- MVar Spot
- MVar Preço Exposição
- MVar Curvas
- BI Luz
- ETL-DW

---

### Padrão C — Flag NULL / Data (Moedas)

| | |
|---|---|
| **Tabela** | `tab_controle_data_processamento` |
| **Banco** | `db_ds_moeda` |
| **Lógica** | Igual ao Padrão A, banco e tabela separados — específico das rotinas de Moedas |
| **Para reprocessar** | `UPDATE` setando a data desejada no campo |

**Rotinas:**
- MOEDA.ANBIMA.INDICES.IPCA.OFICIAL
- MOEDA.ANBIMA.VALORES
- MOEDA.BLOOMBERG.FWD
- MOEDA.BLOOMBERG.IBOVESPA
- MOEDA.BLOOMBERG.LIBOR
- MOEDA.BNDES.INDICES
- MOEDA.CETIP.INDICES
- MOEDA.CHANGE
- MOEDA.CRK
- MOEDA.PU.ANBIMA.VALORES
- MOEDA.SELIC.INDICES
- MOEDA.SELIC.TITULOS

---

### Padrão D — Retroceder data via UPDATE

| | |
|---|---|
| **Tabela** | `tab_controle_reconciliacao` |
| **Banco** | `db_reconciliacao` |
| **Lógica** | A rotina sempre faz D+1 no código. Para reprocessar, volta a data na tabela e ela reprocessa na próxima execução. |
| **Para reprocessar** | `UPDATE` setando D-1 da data desejada |

**Rotinas:**
- Recon BOxBI

---
---
---

### Padrão E — Controle por produto ativo

| | |
|---|---|
| **Tabela** | `tab_grupo_produto_pnl` |
| **Banco** | `db_pnl` |
| **Lógica** | Não é controle de data — é filtro de produtos. `ativo = 1` processa, `ativo = 0` ignora. |
| **Para reprocessar** | `UPDATE` desativando todos exceto o produto desejado. Após execução, reativar todos. |

**Rotinas:**
- PMAD0030 - Cálculo Diário PNL

**Exemplo:**
```sql
-- Reprocessar somente Títulos Públicos (cod_grupo_produto = 7)
UPDATE tab_grupo_produto_pnl
SET ativo = 0
WHERE cod_grupo_produto <> 7

-- Após execução — restaurar todos
UPDATE tab_grupo_produto_pnl
SET ativo = 1
WHERE cod_grupo_produto not in (5, 6, 13, 14, 15, 16)
```

---

### Padrão F — Tabela genérica (rotinas novas)

| | |
|---|---|
| **Tabela** | `tab_controle_reprocessamento_global` |
| **Banco** | `db_stage_bi` *(talvez: `db_reprocessamento`)* |
| **Lógica** | Padrão novo descrito na Camada 1 |

**Rotinas:**
- Mercados Futuros *(primeira rotina a adotar o padrão)*
- Todas as rotinas novas daqui pra frente

---

## Mapeamento Geral de Rotinas

| Rotina | Padrão | Banco | Tabela |
|---|---|---|---|
| MVar Operação | A | db_stage_bi | tab_controle_bi_reprocessamento |
| XOne | B | db_stage_bi | tab_controle_bi |
| Interface Matutino | B | db_stage_bi | tab_controle_bi |
| MVar Spot | B | db_stage_bi | tab_controle_bi |
| MVar Preço Exposição | B | db_stage_bi | tab_controle_bi |
| MVar Curvas | B | db_stage_bi | tab_controle_bi |
| BI Luz | B | db_stage_bi | tab_controle_bi |
| ETL-DW | B | db_stage_bi | tab_controle_bi |
| MOEDA.* (12 rotinas) | C | db_ds_moeda | tab_controle_data_processamento |
| Recon BOxBI | D | db_reconciliacao | tab_controle_reconciliacao |
| PNL | E | db_pnl | tab_grupo_produto_pnl |
| Mercados Futuros | F | db_stage_bi | tab_controle_reprocessamento_global |

---

*Documento criado em 18/04/2026 · Arquitetura: Vinicius Awada · BSG Société Générale*