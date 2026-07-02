// sound.ts — tiny synthesized sound design (Web Audio, no asset files). Every effect is built
// from oscillators + noise so it works offline and weighs nothing. Mute persists locally.

type SfxName = 'card' | 'pass' | 'bomb' | 'turn' | 'win' | 'lose' | 'deal'

const MUTE_KEY = 'guandan.muted'
let muted = ((): boolean => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()

let ctx: AudioContext | null = null

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(m: boolean): void {
  muted = m
  try {
    localStorage.setItem(MUTE_KEY, m ? '1' : '0')
  } catch {
    /* ignore */
  }
}

function tone(
  c: AudioContext,
  {
    freq,
    type = 'sine',
    at = 0,
    dur = 0.12,
    vol = 0.12,
    glideTo,
  }: { freq: number; type?: OscillatorType; at?: number; dur?: number; vol?: number; glideTo?: number },
) {
  const t0 = c.currentTime + at
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

function noise(c: AudioContext, { at = 0, dur = 0.08, vol = 0.1, lowpass = 2200 }: { at?: number; dur?: number; vol?: number; lowpass?: number }) {
  const t0 = c.currentTime + at
  const len = Math.max(1, Math.floor(c.sampleRate * dur))
  const buf = c.createBuffer(1, len, c.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len)
  const src = c.createBufferSource()
  src.buffer = buf
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = lowpass
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t0)
  src.connect(filter).connect(gain).connect(c.destination)
  src.start(t0)
}

/** Fire a named effect (no-op when muted or Web Audio is unavailable). */
export function sfx(name: SfxName): void {
  if (muted) return
  const c = ac()
  if (!c) return
  try {
    switch (name) {
      case 'card': // soft snap: filtered noise + low tick
        noise(c, { dur: 0.05, vol: 0.14, lowpass: 3200 })
        tone(c, { freq: 190, type: 'triangle', dur: 0.06, vol: 0.07 })
        break
      case 'pass': // barely-there tick
        noise(c, { dur: 0.025, vol: 0.05, lowpass: 1600 })
        break
      case 'bomb': // low boom + rumble
        tone(c, { freq: 130, type: 'sawtooth', dur: 0.4, vol: 0.16, glideTo: 40 })
        noise(c, { dur: 0.35, vol: 0.12, lowpass: 500 })
        break
      case 'turn': // gentle two-note chime
        tone(c, { freq: 660, dur: 0.1, vol: 0.07 })
        tone(c, { freq: 990, at: 0.09, dur: 0.14, vol: 0.06 })
        break
      case 'deal': // quick riffle
        for (let i = 0; i < 5; i++) noise(c, { at: i * 0.04, dur: 0.03, vol: 0.05, lowpass: 2600 })
        break
      case 'win': // rising arpeggio
        [523, 659, 784, 1047].forEach((f, i) => tone(c, { freq: f, at: i * 0.12, dur: 0.22, vol: 0.09 }))
        break
      case 'lose': // descending minor
        [392, 311, 262].forEach((f, i) => tone(c, { freq: f, type: 'triangle', at: i * 0.16, dur: 0.26, vol: 0.08 }))
        break
    }
  } catch {
    /* audio failures must never break the game */
  }
}
