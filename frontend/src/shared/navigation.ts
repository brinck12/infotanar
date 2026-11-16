/**
 * Hová és honnan visz az útvonal. Egy helyen van minden, amit a navigáció állapotában
 * (`location.state`) viszünk, hogy az oldalak ugyanúgy tudják: honnan jöttem, és hová
 * érdemes visszamenni.
 */

/** Bejelentkezett tanuló alapértelmezett érkezőoldala: belépés, regisztráció, fizetés és megerősítés után egyaránt. */
export const LANDING_PATH = '/tanulasi-ut'

/** Csak helyi útvonalra engedünk visszatérni, nehogy a kapott érték külső címre vigyen. */
export function localPath(path: string | undefined | null): string | undefined {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') ? path : undefined
}

/** A `from` állapot: a védett oldal, ahová a belépés (regisztráció, fizetés) után vissza kell térni. */
export function fromState(path: string | undefined): { from: string } | undefined {
  const safe = localPath(path)
  return safe === undefined ? undefined : { from: safe }
}

export function readFrom(state: unknown): string | undefined {
  if (typeof state !== 'object' || state === null || !('from' in state)) return undefined
  return localPath(typeof state.from === 'string' ? state.from : undefined)
}

/** Az oldal, ahonnan a felhasználó egy feladatra (vagy más mélyebb oldalra) érkezett; a morzsamenü első eleme lesz. */
export interface Origin {
  label: string
  to: string
}

export function originState(origin: Origin): { origin: Origin } {
  return { origin }
}

export function readOrigin(state: unknown): Origin | null {
  if (typeof state !== 'object' || state === null || !('origin' in state)) return null
  const origin = state.origin
  if (typeof origin !== 'object' || origin === null || !('label' in origin) || !('to' in origin)) return null
  const to = typeof origin.to === 'string' ? localPath(origin.to) : undefined
  return typeof origin.label === 'string' && origin.label !== '' && to !== undefined ? { label: origin.label, to } : null
}
