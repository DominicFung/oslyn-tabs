import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'
import { batchGetAll } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'
import { _JamSession, _JamSong, _SetList, _Song } from '../../type'
import { User } from '../../API'

const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

function keysOf(ids: string[], attribute: string) {
  return ids.map((id) => ({ [attribute]: { S: id } }))
}

/**
 * Fills the selection set for a list of jam rows. Reads only. Does not write policy or any other attribute.
 */
export async function hydrateJamSessions(
  dynamo: DynamoDBClient,
  sessions: _JamSession[],
  selectionSetList: string[]
): Promise<_JamSession[]> {
  if (sessions.length === 0) return sessions

  if (hasSubstring(selectionSetList, "setList")) {
    console.log("getting setList ...")

    const setIds = [...new Set(sessions.map((s) => s.setListId).filter((id) => !!id))]
    const rows = await batchGetAll(dynamo, SETLIST_TABLE_NAME, keysOf(setIds, "setListId"))
    let sets = rows.map((s) => unmarshall(s)) as _SetList[]

    if (hasSubstring(selectionSetList, "setList/songs")) {
      console.log("getting songs ...")

      const songIds = sets.flatMap((s) => (s.songs || []).map((k) => (k as _JamSong | undefined)?.songId).filter((id): id is string => !!id))
      const uniq = [...new Set(songIds)]
      let songs: _Song[] = []

      if (uniq.length > 0) {
        const songRows = await batchGetAll(
          dynamo,
          SONG_TABLE_NAME,
          keysOf(uniq, "songId"),
          songReadOptions(selectionSetList)
        )
        songs = songRows.map((s) => normalizeSong(unmarshall(s) as _Song, selectionSetList))
      }

      if (hasSubstring(selectionSetList, "song/creator") && songs.length > 0) {
        console.log("getting songs/../song/creator ..")
        const creatorIds = [...new Set(songs.map((s) => s.userId).filter((id) => !!id))]
        const userRows = await batchGetAll(dynamo, USER_TABLE_NAME, keysOf(creatorIds, "userId"))
        const users = userRows.map((s) => normalizeUser(unmarshall(s), selectionSetList)) as User[]
        songs = merge(songs, users, 'userId', 'creator')
        songs = songs.map((s) => normalizeSong(s, selectionSetList))
      }

      for (let i = 0; i < sets.length; i++) {
        sets[i].songs = merge(sets[i].songs || [], songs, 'songId', 'song')
      }
    }

    if (hasSubstring(selectionSetList, "setList/creator") && sets.length > 0) {
      console.log("getting creator (user) ...")
      const setUsers = [...new Set(sets.map((s) => s.userId).filter((id) => !!id))]
      const userRows = await batchGetAll(dynamo, USER_TABLE_NAME, keysOf(setUsers, "userId"))
      const users = userRows.map((u) => normalizeUser(unmarshall(u), selectionSetList))
      sets = merge(sets, users, 'userId', 'creator')
    }

    if (hasSubstring(selectionSetList, "setList/editors")) {
      sets = sets.map((e) => ({ ...e, editors: [] }))
    }

    sessions = merge(sessions, sets, "setListId", "setList")
  }

  if (hasSubstring(selectionSetList, "active")) {
    console.log("getting active users ...")

    const userIds = sessions.flatMap((b) => (b.activeIds || []).filter((id) => !!id))
    const uniq = [...new Set(userIds)]

    if (uniq.length > 0) {
      const userRows = await batchGetAll(dynamo, USER_TABLE_NAME, keysOf(uniq, "userId"))
      const users = userRows.map((u) => normalizeUser(unmarshall(u), selectionSetList))

      for (let i = 0; i < sessions.length; i++) {
        sessions[i].active = merge(sessions[i].activeIds || [], users, 'userId', 'active')
      }
    } else {
      for (let i = 0; i < sessions.length; i++) { sessions[i].active = [] }
    }
  }

  if (hasSubstring(selectionSetList, "admins")) {
    const userIds = [...new Set(sessions.map((s) => s.userId).filter((id): id is string => !!id))]
    const userRows = await batchGetAll(dynamo, USER_TABLE_NAME, keysOf(userIds, "userId"))
    const users = userRows.map((u) => normalizeUser(unmarshall(u), selectionSetList))

    sessions = merge(sessions, users, 'userId', 'admins')
    sessions.forEach((s) => { s.admins = [s.admins as unknown as User] })
  }

  if (hasSubstring(selectionSetList, "members")) {
    sessions.forEach((s) => { if (!s.members) s.members = [] })
  }

  if (hasSubstring(selectionSetList, "guests")) {
    sessions.forEach((s) => { if (!s.guests) s.guests = [] })
  }

  return sessions
}
