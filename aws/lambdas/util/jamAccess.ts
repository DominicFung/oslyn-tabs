import { _JamSession } from '../type'
import { idList } from './batch'

type JamWithToken = _JamSession & { joinToken?: string | null }

/** A share link matches only this jam's token. Public rooms do not need one. */
export function joinTokenMatches(jam: JamWithToken, joinToken?: string | null): boolean {
  return !!joinToken && !!jam.joinToken && joinToken === jam.joinToken
}

/** Host and members may open a private room. A valid share token admits anyone else. */
export function canJoinJam(jam: JamWithToken, userId?: string | null, joinToken?: string | null): boolean {
  if (jam.policy !== 'PRIVATE') return true
  if (joinTokenMatches(jam, joinToken)) return true
  if (!userId) return false
  if (jam.userId === userId) return true
  if (idList(jam.adminIds).includes(userId)) return true
  if (idList(jam.memberIds).includes(userId)) return true
  return false
}

/** Signed-in share-link visitors are stored as members so they can return without the link. */
export function memberIdsWith(jam: _JamSession, userId?: string | null): string[] | undefined {
  if (!userId) return undefined
  if (jam.userId === userId) return undefined
  if (idList(jam.adminIds).includes(userId)) return undefined
  const members = idList(jam.memberIds)
  if (members.includes(userId)) return undefined
  return [...members, userId]
}

/** Host and admins may add songs. Does not grant queue writes. */
export function canEditJamSongs(jam: _JamSession, userId?: string | null): boolean {
  if (!userId) return false
  if (jam.userId === userId) return true
  return idList(jam.adminIds).includes(userId)
}
