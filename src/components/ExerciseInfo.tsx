import { LADDERS, videoUrl, type ResolvedStep } from '../program/ladders.ts'

/** Nome, degrau, execução e link de vídeo. Com onChangeStep, permite trocar o degrau. */
export function ExerciseInfo({ step, onChangeStep }: { step: ResolvedStep; onChangeStep?: (index: number) => void }) {
  const total = LADDERS[step.ladderId].steps.length
  return (
    <div className="exercise">
      <div className="step-picker">
        {onChangeStep && (
          <button
            type="button"
            className="step-arrow"
            aria-label="Degrau mais fácil"
            disabled={step.index === 0}
            onClick={() => onChangeStep(step.index - 1)}
          >
            ‹
          </button>
        )}
        <div className="step-title">
          <h1>{step.name}</h1>
          <p className="muted">
            Degrau {step.index + 1} de {total}
            {step.perSide && ' · por lado'}
          </p>
        </div>
        {onChangeStep && (
          <button
            type="button"
            className="step-arrow"
            aria-label="Degrau mais difícil"
            disabled={step.index === total - 1}
            onClick={() => onChangeStep(step.index + 1)}
          >
            ›
          </button>
        )}
      </div>
      <p>{step.description}</p>
      <a className="video-link" href={videoUrl(step)} target="_blank" rel="noreferrer">
        ▶ Ver execução no YouTube
      </a>
    </div>
  )
}
