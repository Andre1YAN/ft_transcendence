// src/State/gameState.ts
import type { GameMode } from '../components/GameCanvas'

export let currentMode: GameMode = 'local'

export function setMode(mode: GameMode) {
  currentMode = mode
}
