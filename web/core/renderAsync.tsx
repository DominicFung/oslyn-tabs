import { ReactElement } from "react"

/**
 * TypeScript 5.0 rejects async Server Components in JSX (Promise is not a valid element).
 * The cast is type-only; React still renders the async function and can suspend.
 */
export function renderAsync<P extends object>(Component: (props: P) => Promise<ReactElement>, props: P) {
  const View = Component as unknown as (props: P) => ReactElement
  return <View {...props} />
}
