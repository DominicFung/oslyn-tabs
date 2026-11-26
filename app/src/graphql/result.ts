/** Amplify rejects the promise when AppSync returns errors, even if `data` is filled in. */

export function graphqlData<T>(result: unknown): T | null {
  if (!result || typeof result !== 'object') return null
  if (!('data' in result)) return null
  const data = (result as { data?: T | null }).data
  return data ?? null
}

export function graphqlMessage(result: unknown): string {
  const errors = errorMessages(result)
  if (errors) return errors
  if (result instanceof Error && result.message) return result.message
  return 'Request failed'
}

function errorMessages(result: unknown): string {
  if (Array.isArray(result)) {
    return result.map((item) => messageOf(item)).filter(Boolean).join('; ')
  }
  if (!result || typeof result !== 'object') return ''
  return messageOf(result)
}

function messageOf(result: unknown): string {
  if (!result || typeof result !== 'object') return ''
  const errors = (result as { errors?: { message?: string }[] }).errors
  if (!Array.isArray(errors)) return ''
  return errors.map((error) => error?.message).filter((message): message is string => !!message).join('; ')
}
