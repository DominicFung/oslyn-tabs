export type Insets = { top: number, right: number, bottom: number, left: number }

/** Modal card inside the safe area. Position is top/left, because insets are not symmetric. */
export function gearModalFrame(
  window: { width: number, height: number },
  insets: Insets,
  margin = 8,
) {
  const width = window.width - insets.left - insets.right - margin * 2
  const height = window.height - insets.top - insets.bottom - margin * 2
  return {
    width: Math.max(0, width),
    height: Math.max(0, height),
    top: insets.top + margin,
    left: insets.left + margin,
  }
}

/**
 * Place the unscaled lyric block so its center is the center of the stage.
 * React Native scales around the view center, so left/top describe the layout box.
 * Scale shrinks a line that would otherwise run past the stage padding.
 */
export function lyricPlacement(
  stage: { width: number, height: number },
  block: { width: number, height: number },
  pad = 16,
) {
  const availW = Math.max(1, stage.width - pad * 2)
  const availH = Math.max(1, stage.height - pad * 2)
  const blockW = Math.max(block.width, 1)
  const blockH = Math.max(block.height, 1)
  const scale = Math.min(1, availW / blockW, availH / blockH)
  return {
    scale,
    left: stage.width / 2 - blockW / 2,
    top: stage.height / 2 - blockH / 2,
  }
}

/** Visible edges after the center-origin scale. Used to prove a long line stays on screen. */
export function lyricVisualBounds(
  stage: { width: number, height: number },
  block: { width: number, height: number },
  pad = 16,
) {
  const place = lyricPlacement(stage, block, pad)
  const visualW = Math.max(block.width, 1) * place.scale
  const visualH = Math.max(block.height, 1) * place.scale
  const centerX = place.left + Math.max(block.width, 1) / 2
  const centerY = place.top + Math.max(block.height, 1) / 2
  return {
    scale: place.scale,
    left: centerX - visualW / 2,
    right: centerX + visualW / 2,
    top: centerY - visualH / 2,
    bottom: centerY + visualH / 2,
  }
}
