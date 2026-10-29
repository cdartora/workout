# Workout — Especificação da v1

Companion pessoal de treino de **calistenia em casa** com foco em **hipertrofia**,
com nutrição simples. Definido em sessão de brainstorm (estilo *grill-me*) em 2026-10-29.

## 1. Contexto do usuário

| Item | Valor |
|---|---|
| Usuário | Só uma pessoa (uso pessoal) |
| Perfil | 25 anos, 1,90 m, 73 kg (IMC ~20) — lado magro |
| Objetivo | Hipertrofia com superávit leve (bulking limpo) |
| Local | Casa |
| Equipamento | Barra fixa, elásticos de resistência, mesa firme |
| Frequência | 3x/semana, ~40 min, à noite |
| Aparelho | iPhone |

**Problemas que o app resolve (em ordem):**
1. **Constância** — não abandonar.
2. **Ver progresso** — perceber evolução.
3. **Saber o que fazer** — plano pronto, sem pensar.

## 2. Plataforma e arquitetura

- **PWA** instalável na Tela de Início do iPhone; funciona offline.
- **Sem servidor e sem conta** na v1: todos os dados ficam no aparelho (IndexedDB).
- Stack: **Vite + React + TypeScript**, **Dexie** (IndexedDB), **vite-plugin-pwa**.
- Hospedagem: **GitHub Pages** (repositório público `cdartora/workout`), deploy via
  GitHub Actions a cada push. Nenhum dado pessoal vai para o repositório.
- Interface em **português**, **tema escuro**, botões grandes (uso com uma mão).

## 3. Programa de treino

### Estrutura
- **Corpo inteiro, dois treinos alternados: A e B** (semana 1: A-B-A; semana 2: B-A-B…).
- Dias **flexíveis**: o app indica o próximo treino, não um dia fixo.
- Cada treino: **5 min de aquecimento guiado** + **5 blocos × 3 séries**, ~90 s de descanso.

### Treino A
| Bloco | Escada de progressão (degraus) |
|---|---|
| Empurrar (peito/tríceps) | Flexão na parede → inclinada → normal → diamante → archer |
| Puxar vertical (costas) | Pendurar ativo → negativa → barra com elástico → barra fixa → barra com mochila |
| Pernas (quadríceps) | Agachamento → afundo → búlgaro → pistol assistido → pistol |
| Braços (elástico) | Rosca bíceps + tríceps (superset) |
| Core | Elevação de joelhos na barra → elevação de pernas |

### Treino B
| Bloco | Escada de progressão (degraus) |
|---|---|
| Empurrar (ombro) | Pike inclinado → pike → pike pés elevados → negativa de parada de mão na parede |
| Puxar horizontal (costas) | Remada com elástico → remada invertida sob mesa → remada invertida pés elevados |
| Pernas (posterior/glúteo) | Ponte → ponte unilateral → flexão de joelhos com toalha → nórdico negativo |
| Ombros (elástico) | Elevação lateral + face pull (superset) |
| Core | Prancha → hollow hold |

Exercícios isométricos (pendurar ativo, prancha, hollow hold) usam **segundos** no lugar de repetições.

### Regra de progressão — dupla progressão
- Faixa padrão: **3 × 6–12** repetições (pernas: **3 × 8–20**; isométricos: **3 × 15–45 s**).
- Meta da próxima sessão: **+1 repetição** em pelo menos uma série em relação à última.
- Ao completar **todas as séries no topo da faixa**, o app **sugere subir de degrau**;
  o usuário aceita ou mantém (palavra final é dele). Ao subir, a meta volta ao início da faixa.
- Cada subida de degrau gera uma **conquista**.

### Teste de nível
- No **primeiro uso** (~15 min): máximo de repetições com boa forma em movimentos-base
  (flexão, barra/pendurar, agachamento, remada, pike, prancha), com degraus mais fáceis
  como fallback quando o resultado é zero.
- Define o **degrau inicial** de cada escada.
- **Repetido a cada 4–6 semanas** (o app sugere) — serve como marco de progresso
  ("set: 2 barras → nov: 7 barras").

## 4. Experiência durante o treino (modo guiado)

- **Uma tela por exercício**: nome, degrau atual, descrição curta da execução
  e **link para vídeo no YouTube**.
- **Meta da série** visível ("objetivo: 9"), vinda da última sessão.
- Registro com **botões grandes de + e −**, pré-preenchidos com a meta (“Feito” = 1 toque).
- **Timer de descanso automático** (~90 s) com vibração/som ao terminar.
- Avanço automático para a próxima série/exercício.
- **Tela sempre acesa** durante o treino (Wake Lock).
- **Resumo final**: comparação com a sessão anterior, recordes, sugestões de subida de degrau.

## 5. Nutrição (simples)

- **Meta de proteína**: ~1,8 g/kg → **~130 g/dia** (recalculada conforme o peso).
- **Atalhos de alimentos**: o usuário cadastra porções que come de verdade
  (ex.: "3 ovos = 18 g", "whey 1 scoop = 24 g"); um toque adiciona ao dia.
- **Sem contagem de calorias** na v1.
- **Pesagem semanal** (segunda de manhã, em jejum):
  - Meta: **+0,2 a +0,35 kg/semana**.
  - 2 semanas sem subir → sugere adicionar ~300 kcal/dia (com exemplo de lanche).
  - Acima de ~0,5 kg/semana → sugere segurar.

> Referências gerais para hipertrofia; não substituem orientação de um profissional de saúde.

## 6. Motivação

- **Lembretes via app Atalhos do iOS** (sem push web na v1): o app tem uma tela com
  passo a passo para criar automações (treino seg/qua/sex ~19h; proteína ~21h).
- **Sequência semanal**: semanas seguidas com 3/3 treinos + calendário estilo GitHub.
  Constância é medida **por semana**, não por dias seguidos.
- **Conquistas** por marcos reais: primeira barra completa, 10 flexões, novo degrau,
  +5 kg de peso corporal, etc.
- **Fotos de progresso** mensais (frente/lado/costas), comprimidas (~200 KB),
  guardadas no app, com comparação lado a lado.

## 7. Dados e backup

- Tudo em IndexedDB no aparelho.
- **Exportar backup**: arquivo único (inclui fotos) salvo via menu de compartilhar → iCloud Drive.
- **Importar backup**: restaura tudo.
- **Lembrete de backup**: se o último tiver mais de 7 dias, o app sugere — de preferência
  logo após a pesagem de segunda.

## 8. Telas

Barra inferior com 4 abas:

1. **Hoje**
   - Card principal contextual: dia de treino ("Treino B · ~40 min" + metas + **Começar**),
     dia de descanso (próximo treino + destaque para proteína) ou pesagem (segunda).
   - Semana: ●●○ (treinos feitos/3) + sequência de semanas.
   - Proteína do dia: barra de progresso + atalhos.
2. **Progresso** — gráficos de repetições/degraus por exercício, peso corporal,
   calendário, conquistas, fotos.
3. **Nutrição** — registro do dia, gerenciar atalhos, histórico de proteína e peso.
4. **Ajustes** — backup, guia do Atalhos, refazer teste de nível, perfil (peso/altura).

## 9. Fora da v1 (backlog)

- Servidor de push (ex.: Cloudflare Worker) para lembretes inteligentes com detalhe do treino.
- Mensagens de "coach" (possivelmente com IA).
- Guia por voz durante o treino.
- GIFs/animações próprias dos exercícios.
- Contagem de calorias e banco de alimentos.
- Sincronização na nuvem / multiusuário.
- Semanas de deload automáticas.
