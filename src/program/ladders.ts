// Catálogo de escadas de progressão. Cada escada é um padrão de movimento;
// cada degrau é uma variação mais difícil que a anterior.

export type Unit = 'reps' | 'seconds'
export type Range = readonly [min: number, max: number]

export interface Step {
  id: string
  name: string
  description: string
  /** Sobrescreve a unidade da escada (ex.: "pendurar ativo" é em segundos). */
  unit?: Unit
  /** Sobrescreve a faixa da escada. */
  range?: Range
  /** Exercício unilateral: repetições contadas por lado. */
  perSide?: boolean
}

export interface Ladder {
  id: LadderId
  name: string
  unit: Unit
  range: Range
  steps: readonly Step[]
}

export type LadderId =
  | 'push_h'
  | 'pull_v'
  | 'legs_squat'
  | 'biceps'
  | 'triceps'
  | 'core_hanging'
  | 'push_v'
  | 'pull_h'
  | 'legs_hinge'
  | 'lateral'
  | 'face_pull'
  | 'core_floor'

const bandSteps = (id: string, name: string, description: string): Step[] => [
  { id: `${id}_leve`, name: `${name} (elástico leve)`, description },
  { id: `${id}_medio`, name: `${name} (elástico médio)`, description },
  { id: `${id}_forte`, name: `${name} (elástico forte)`, description },
]

export const LADDERS: Record<LadderId, Ladder> = {
  push_h: {
    id: 'push_h',
    name: 'Flexão',
    unit: 'reps',
    range: [6, 12],
    steps: [
      {
        id: 'flexao_parede',
        name: 'Flexão na parede',
        description: 'Mãos na parede na altura do peito, corpo reto. Leve o peito até a parede e empurre.',
      },
      {
        id: 'flexao_inclinada',
        name: 'Flexão inclinada',
        description: 'Mãos na borda da mesa firme, corpo em prancha. Desça o peito até a borda e empurre.',
      },
      {
        id: 'flexao',
        name: 'Flexão',
        description:
          'Mãos um pouco além dos ombros, cotovelos a ~45° do corpo. Peito quase no chão, corpo reto do início ao fim.',
      },
      {
        id: 'flexao_diamante',
        name: 'Flexão diamante',
        description: 'Mãos juntas formando um diamante sob o peito. Cotovelos junto ao corpo — foco em tríceps.',
      },
      {
        id: 'flexao_archer',
        name: 'Flexão archer',
        description:
          'Mãos bem afastadas. Desça sobre um braço enquanto o outro fica estendido para o lado. Alterne os lados.',
        perSide: true,
      },
    ],
  },
  pull_v: {
    id: 'pull_v',
    name: 'Barra fixa',
    unit: 'reps',
    range: [6, 12],
    steps: [
      {
        id: 'pendurar_ativo',
        name: 'Pendurar ativo',
        description:
          'Pendurado na barra com braços estendidos, puxe os ombros para baixo (afastando-os das orelhas) e segure.',
        unit: 'seconds',
        range: [15, 45],
      },
      {
        id: 'barra_negativa',
        name: 'Barra negativa',
        description:
          'Suba com ajuda de uma cadeira até o queixo passar a barra e desça o mais devagar possível (3–5 s).',
        range: [4, 8],
      },
      {
        id: 'barra_elastico',
        name: 'Barra com elástico',
        description:
          'Elástico preso na barra e apoiado no pé ou joelho. Puxe até o queixo passar a barra. Ficou fácil? Use um elástico mais fino.',
      },
      {
        id: 'barra_fixa',
        name: 'Barra fixa',
        description:
          'Pegada pronada um pouco além dos ombros. Do braço totalmente estendido até o queixo acima da barra, sem balançar.',
      },
      {
        id: 'barra_mochila',
        name: 'Barra com mochila',
        description: 'Barra fixa usando uma mochila com peso (livros, garrafas de água). Ficou fácil? Mais peso.',
      },
    ],
  },
  legs_squat: {
    id: 'legs_squat',
    name: 'Agachamento',
    unit: 'reps',
    range: [8, 20],
    steps: [
      {
        id: 'agachamento',
        name: 'Agachamento livre',
        description: 'Pés na largura dos ombros. Desça até a coxa ficar paralela ao chão, calcanhares sempre no chão.',
      },
      {
        id: 'afundo',
        name: 'Afundo',
        description: 'Dê um passo à frente e desça até o joelho de trás quase tocar o chão. Tronco reto.',
        perSide: true,
      },
      {
        id: 'bulgaro',
        name: 'Agachamento búlgaro',
        description: 'Pé de trás apoiado no sofá ou cadeira. Desça na perna da frente até a coxa ficar paralela.',
        perSide: true,
      },
      {
        id: 'pistol_assistido',
        name: 'Pistol assistido',
        description: 'Agachamento em uma perna só, segurando no batente da porta ou na mesa para equilíbrio.',
        perSide: true,
      },
      {
        id: 'pistol',
        name: 'Pistol',
        description: 'Agachamento completo em uma perna, a outra estendida à frente, sem apoio.',
        perSide: true,
      },
    ],
  },
  biceps: {
    id: 'biceps',
    name: 'Rosca bíceps',
    unit: 'reps',
    range: [10, 15],
    steps: bandSteps(
      'rosca',
      'Rosca bíceps',
      'Pise no elástico, cotovelos colados ao corpo. Suba as mãos até os ombros e desça devagar.',
    ),
  },
  triceps: {
    id: 'triceps',
    name: 'Tríceps',
    unit: 'reps',
    range: [10, 15],
    steps: bandSteps(
      'triceps',
      'Tríceps acima da cabeça',
      'Elástico preso sob o pé de trás, mãos atrás da cabeça. Estenda os cotovelos para cima sem abrir os braços.',
    ),
  },
  core_hanging: {
    id: 'core_hanging',
    name: 'Core na barra',
    unit: 'reps',
    range: [8, 15],
    steps: [
      {
        id: 'elevacao_joelhos',
        name: 'Elevação de joelhos',
        description: 'Pendurado na barra, suba os joelhos até a altura do quadril sem balançar. Desça controlando.',
      },
      {
        id: 'elevacao_pernas',
        name: 'Elevação de pernas',
        description: 'Pendurado na barra, suba as pernas estendidas até a horizontal. Desça devagar.',
      },
      {
        id: 'toes_to_bar',
        name: 'Pés na barra',
        description: 'Pendurado, suba as pernas estendidas até os pés tocarem a barra.',
      },
    ],
  },
  push_v: {
    id: 'push_v',
    name: 'Pike',
    unit: 'reps',
    range: [6, 12],
    steps: [
      {
        id: 'pike_inclinado',
        name: 'Pike inclinado',
        description:
          'Mãos na borda da mesa, quadril alto formando um V invertido. Desça a cabeça em direção à borda e empurre.',
      },
      {
        id: 'pike',
        name: 'Pike push-up',
        description: 'Mãos no chão, quadril alto em V invertido. Desça o topo da cabeça entre as mãos e empurre.',
      },
      {
        id: 'pike_elevado',
        name: 'Pike com pés elevados',
        description: 'Pés no sofá ou cadeira, quadril acima dos ombros. Mesma execução do pike.',
      },
      {
        id: 'parada_negativa',
        name: 'Negativa de parada de mão',
        description:
          'Suba em parada de mão com a barriga virada para a parede e desça devagar (3–5 s) até a cabeça quase tocar o chão.',
        range: [3, 8],
      },
    ],
  },
  pull_h: {
    id: 'pull_h',
    name: 'Remada',
    unit: 'reps',
    range: [6, 12],
    steps: [
      {
        id: 'remada_elastico',
        name: 'Remada com elástico',
        description:
          'Elástico preso na maçaneta de uma porta fechada. Puxe os cotovelos para trás apertando as escápulas.',
      },
      {
        id: 'remada_mesa',
        name: 'Remada invertida sob a mesa',
        description:
          'Deitado sob a mesa, segure a borda e puxe o peito até ela com o corpo reto. Confira antes se a mesa não tomba.',
      },
      {
        id: 'remada_mesa_elevada',
        name: 'Remada invertida com pés elevados',
        description: 'Igual à remada sob a mesa, com os pés numa cadeira para aumentar a carga.',
      },
    ],
  },
  legs_hinge: {
    id: 'legs_hinge',
    name: 'Posterior e glúteo',
    unit: 'reps',
    range: [8, 20],
    steps: [
      {
        id: 'ponte',
        name: 'Ponte de glúteo',
        description: 'Deitado de barriga para cima, joelhos dobrados. Suba o quadril apertando o glúteo; pause 1 s no topo.',
      },
      {
        id: 'ponte_unilateral',
        name: 'Ponte unilateral',
        description: 'A mesma ponte, com uma perna estendida no ar.',
        perSide: true,
      },
      {
        id: 'flexora_toalha',
        name: 'Flexão de joelhos com toalha',
        description:
          'Calcanhares sobre uma toalha em piso liso, quadril elevado. Puxe os calcanhares até o glúteo e volte devagar.',
        range: [6, 15],
      },
      {
        id: 'nordico_negativo',
        name: 'Nórdico negativo',
        description:
          'Ajoelhado, pés presos sob o sofá. Desça o tronco à frente o mais devagar possível; apoie as mãos no fim.',
        range: [3, 8],
      },
    ],
  },
  lateral: {
    id: 'lateral',
    name: 'Elevação lateral',
    unit: 'reps',
    range: [10, 15],
    steps: bandSteps(
      'lateral',
      'Elevação lateral',
      'Pise no elástico, braços quase estendidos. Eleve as mãos para os lados até a altura dos ombros.',
    ),
  },
  face_pull: {
    id: 'face_pull',
    name: 'Face pull',
    unit: 'reps',
    range: [10, 15],
    steps: bandSteps(
      'face_pull',
      'Face pull',
      'Elástico preso na altura do rosto. Puxe em direção à testa abrindo os cotovelos e girando as mãos para trás.',
    ),
  },
  core_floor: {
    id: 'core_floor',
    name: 'Core no chão',
    unit: 'seconds',
    range: [15, 45],
    steps: [
      {
        id: 'prancha',
        name: 'Prancha',
        description: 'Antebraços no chão, corpo reto da cabeça aos calcanhares, abdômen e glúteo contraídos.',
        range: [20, 60],
      },
      {
        id: 'hollow',
        name: 'Hollow hold',
        description:
          'Deitado, lombar colada no chão, braços e pernas estendidos e levemente elevados. Segure sem tirar a lombar do chão.',
      },
    ],
  },
}

export const LADDER_IDS = Object.keys(LADDERS) as LadderId[]

export interface ResolvedStep extends Step {
  ladderId: LadderId
  index: number
  unit: Unit
  range: Range
}

/** Degrau com unidade e faixa já resolvidas (próprias ou herdadas da escada). */
export function resolveStep(ladderId: LadderId, index: number): ResolvedStep {
  const ladder = LADDERS[ladderId]
  const i = Math.max(0, Math.min(index, ladder.steps.length - 1))
  const step = ladder.steps[i]
  return { ...step, ladderId, index: i, unit: step.unit ?? ladder.unit, range: step.range ?? ladder.range }
}

export function findStep(ladderId: LadderId, stepId: string): ResolvedStep {
  const index = LADDERS[ladderId].steps.findIndex((s) => s.id === stepId)
  return resolveStep(ladderId, index === -1 ? 0 : index)
}

/** Link de busca no YouTube: sempre funciona e mostra várias demonstrações. */
export function videoUrl(step: Step): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${step.name} execução calistenia`)}`
}

export function formatValue(value: number, unit: Unit): string {
  return unit === 'seconds' ? `${value}s` : String(value)
}
