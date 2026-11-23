export type JamListRow = {
  jamSessionId?: string | null
  description?: string | null
  policy?: string | null
  startDate?: number | null
  endDate?: number | null
  setList?: { setListId?: string | null, description?: string | null } | null
  active?: Array<{ userId?: string | null, user?: { userId?: string | null, imageUrl?: string | null } | null } | null> | null
}

export function jamRows<T extends { jamSessionId?: string | null, endDate?: number | null }>(
  rows: Array<T | null> | null | undefined
): T[] {
  return (rows || []).filter((row): row is T => {
    return !!row && typeof row.jamSessionId === 'string' && row.jamSessionId.length > 0 && !row.endDate
  })
}

export function jamLabel(row: { description?: string | null, setList?: { description?: string | null } | null }): string {
  const description = row.description?.trim() || row.setList?.description?.trim()
  return description || 'Untitled room'
}

const JAM_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function parseJamTarget(input: string): { jamSessionId: string, joinToken?: string } | null {
  const raw = input.trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    const parts = url.pathname.split('/').filter(Boolean)
    const at = parts.findIndex((part) => part === 'jam')
    const id = at >= 0 ? parts[at + 1] : ''
    if (!id || !JAM_ID.test(id)) return null
    const join = url.searchParams.get('join') || url.searchParams.get('joinToken') || ''
    return join ? { jamSessionId: id, joinToken: join } : { jamSessionId: id }
  } catch {
    if (JAM_ID.test(raw)) return { jamSessionId: raw }
    return null
  }
}
