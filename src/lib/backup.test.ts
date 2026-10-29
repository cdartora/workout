import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db.ts'
import { createBackup, lastBackupAt, parseBackup, restoreBackup } from './backup.ts'

describe('backup', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('exporta e restaura todos os dados, inclusive fotos', async () => {
    const jpeg = new Uint8Array(70_000).map((_, i) => i % 256)
    await db.sessions.add({ workout: 'A', startedAt: 1, finishedAt: 2, cursor: 18, entries: [] })
    await db.weighIns.add({ date: 10, weightKg: 73.4 })
    await db.photos.add({ date: 10, pose: 'frente', blob: new Blob([jpeg], { type: 'image/jpeg' }) })
    await db.ladders.put({ ladderId: 'pull_v', stepIndex: 3, updatedAt: 5 })

    const text = JSON.stringify(await createBackup(123))

    // Aparelho novo: dados diferentes que serão substituídos.
    await db.delete()
    await db.open()
    await db.sessions.add({ workout: 'B', startedAt: 9, cursor: 0, entries: [] })

    const result = await restoreBackup(parseBackup(text))
    expect(result).toEqual({ sessions: 1, photos: 1 })
    expect(await lastBackupAt()).toBe(123)
    expect(await db.sessions.toArray()).toMatchObject([{ workout: 'A', finishedAt: 2 }])
    expect((await db.weighIns.toArray())[0].weightKg).toBe(73.4)
    expect((await db.ladders.get('pull_v'))?.stepIndex).toBe(3)
    // Atalhos de exemplo do banco novo foram substituídos pelos do backup (que também os tinha).
    expect(await db.foodShortcuts.count()).toBe(8)

    const photo = (await db.photos.toArray())[0]
    expect(photo.blob.type).toBe('image/jpeg')
    expect(new Uint8Array(await photo.blob.arrayBuffer())).toEqual(jpeg)
  })

  it('rejeita arquivos que não são backup do app', () => {
    expect(() => parseBackup('não é json')).toThrow('JSON inválido')
    expect(() => parseBackup('{"app":"outro","tables":{}}')).toThrow('não é um backup do Workout')
    expect(() => parseBackup('{"app":"workout","format":99,"tables":{}}')).toThrow('versão mais nova')
    expect(() => parseBackup('{"app":"workout","format":1,"tables":{"sessions":5}}')).toThrow('corrompido')
  })
})
