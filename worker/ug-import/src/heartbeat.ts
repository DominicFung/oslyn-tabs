import { writeFileSync } from 'fs'

export function touchHeartbeat(file = 'worker.heartbeat') {
  writeFileSync(file, `${Date.now()}\n`)
}
