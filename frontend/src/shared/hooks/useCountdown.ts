import { useCallback, useEffect, useState } from 'react'

/**
 * Másodperces visszaszámlálás. A hátralévő időt a határidőből számolja (nem
 * léptetéssel), így háttérbe tett, lassított lapon sem csúszik el.
 */
export function useCountdown(): { seconds: number; start: (seconds: number) => void } {
  const [deadline, setDeadline] = useState<number | null>(null)
  const [seconds, setSeconds] = useState(0)

  const start = useCallback((from: number) => {
    setDeadline(Date.now() + from * 1000)
    setSeconds(from)
  }, [])

  useEffect(() => {
    if (deadline === null) return

    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(left)
      if (left === 0) window.clearInterval(timer)
    }, 1000)

    return () => window.clearInterval(timer)
  }, [deadline])

  return { seconds, start }
}
