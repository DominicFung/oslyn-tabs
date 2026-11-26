/** Square band thumbnail, in points. Stays inside 72–96 so the art stays a thumbnail. */
export const BAND_THUMB_SIZE = 84

export const BAND_THUMB_RESIZE_MODE = 'cover' as const

export function bandThumbFrame(size = BAND_THUMB_SIZE) {
  return {
    width: size,
    height: size,
    aspectRatio: 1 as const,
    borderRadius: 12,
  }
}

/**
 * Top only. The tab bar applies the bottom inset, and every tab and
 * back-stack screen shares this Screen, so a bottom edge here would pad twice.
 */
export const SCREEN_SAFE_EDGES = ['top'] as const
