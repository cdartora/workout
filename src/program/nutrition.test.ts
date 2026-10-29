import { describe, expect, it } from 'vitest'
import { parseDecimal, proteinGoal, weeklyChange, weightAdvice } from './nutrition.ts'

const DAY = 24 * 60 * 60 * 1000
const at = (day: number, weightKg: number) => ({ date: day * DAY, weightKg })

describe('proteinGoal', () => {
  it('usa 1,8 g/kg arredondado de 5 em 5', () => {
    expect(proteinGoal(73)).toBe(130)
    expect(proteinGoal(80)).toBe(145)
  })
})

describe('weeklyChange', () => {
  it('precisa de uma pesagem de pelo menos 5 dias antes', () => {
    expect(weeklyChange([at(0, 73)])).toBeUndefined()
    expect(weeklyChange([at(0, 73), at(3, 73.5)])).toBeUndefined()
  })

  it('normaliza para kg por semana', () => {
    expect(weeklyChange([at(0, 73), at(7, 73.3)])).toBeCloseTo(0.3)
    expect(weeklyChange([at(0, 73), at(14, 73.6)])).toBeCloseTo(0.3)
  })
})

describe('weightAdvice', () => {
  it('classifica a velocidade de ganho', () => {
    expect(weightAdvice([at(0, 73), at(7, 73.3)]).kind).toBe('on-track')
    expect(weightAdvice([at(0, 73), at(7, 73.1)]).kind).toBe('slow')
    expect(weightAdvice([at(0, 73), at(7, 73.45)]).kind).toBe('fast')
    expect(weightAdvice([at(0, 73), at(7, 73.8)]).kind).toBe('too-fast')
  })

  it('detecta estagnação em duas semanas', () => {
    expect(weightAdvice([at(0, 73), at(7, 73.1), at(14, 73.1)]).kind).toBe('stalled')
    expect(weightAdvice([at(0, 73), at(7, 73.2), at(14, 73.5)]).kind).toBe('on-track')
  })
})

describe('parseDecimal', () => {
  it('aceita vírgula e ponto', () => {
    expect(parseDecimal('73,4')).toBe(73.4)
    expect(parseDecimal('73.4')).toBe(73.4)
    expect(parseDecimal('abc')).toBeUndefined()
    expect(parseDecimal('')).toBeUndefined()
  })
})
