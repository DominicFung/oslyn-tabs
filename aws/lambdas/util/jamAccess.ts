import { _JamSession } from '../type'
import { idList } from './batch'

/** Host and members may open a private room. Public rooms stay open. */
export function canJoinJam(jam: _JamSession, userId?: string | null): boolean {
  if (jam.policy !== 'PRIVATE') return true
  if (!userId) return false
  if (jam.userId === userId) return true
  if (idList(jam.adminIds).includes(userId)) return true
  if (idList(jam.memberIds).includes(userId)) return true
  return false
}

/** Host and admins may add songs. Does not grant queue writes. */
export function canEditJamSongs(jam: _JamSession, userId?: string | null): boolean {
  if (!userId) return false
  if (jam.userId === userId) return true
  return idList(jam.adminIds).includes(userId)
}
