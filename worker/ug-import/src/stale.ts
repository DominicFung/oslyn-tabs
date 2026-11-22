/** A claim left IMPORTING this long is treated as abandoned. I Speak Jesus and Perfect both sat here. */
export const STALE_IMPORT_MS = 3 * 60 * 1000

export type ImportStamp = {
  requestId: string
  status: string
  updatedAt?: number | null
  title?: string | null
}

export function isStaleImport(row: ImportStamp, now: number, maxAgeMs = STALE_IMPORT_MS): boolean {
  return row.status === 'IMPORTING'
    && typeof row.updatedAt === 'number'
    && Number.isFinite(row.updatedAt)
    && now - row.updatedAt >= maxAgeMs
}

/** Abandoned IMPORTING rows first, then a normal pending row. A fresh IMPORTING claim is left alone. */
export function nextImport(rows: ImportStamp[], now: number, maxAgeMs = STALE_IMPORT_MS): ImportStamp | null {
  const stale = rows.find((row) => isStaleImport(row, now, maxAgeMs))
  if (stale) return stale
  return rows.find((row) => row.status === 'PENDING') || null
}
