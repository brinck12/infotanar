import { useMutation } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useCallback, useEffect, useRef, useState } from 'react'
import { hibaUzenet } from '../api/errors'

export const OFFLINE_MESSAGE = 'Nincs internet, a fájl nem ment fel. Ellenőrizd a kapcsolatot, és próbáld újra.'

interface UploadOptions<T> {
  send: (file: File, onProgress: (percent: number) => void, signal: AbortSignal) => Promise<T>
  onSuccess?: (result: T) => void
  onError?: (error: unknown) => void
  /** Igaz hibánál a hibasáv nem jelenik meg (pl. a zárolás külön nézetet kap). */
  hideError?: (error: unknown) => boolean
}

/**
 * Fájlfeltöltés előrehaladással, korai hálózati hibafelismeréssel (`navigator.onLine`,
 * `offline` esemény, válasz nélküli hiba) és újrapróbálással ugyanazzal a fájllal.
 */
export function useFileUpload<T>({ send, onSuccess, onError, hideError }: UploadOptions<T>) {
  const [progress, setProgress] = useState<{ name: string; percent: number } | null>(null)
  const [offline, setOffline] = useState(false)
  const lastFile = useRef<File | null>(null)
  const controller = useRef<AbortController | null>(null)
  const abortedOffline = useRef(false)

  const mutation = useMutation({
    mutationFn: (file: File) => {
      const abort = new AbortController()
      controller.current = abort
      return send(file, (percent) => setProgress({ name: file.name, percent }), abort.signal)
    },
    onMutate: (file) => {
      setOffline(false)
      setProgress({ name: file.name, percent: 0 })
    },
    onSuccess,
    onError: (error) => {
      if (abortedOffline.current || (error instanceof AxiosError && !error.response)) setOffline(true)
      onError?.(error)
    },
    onSettled: () => {
      setProgress(null)
      abortedOffline.current = false
    },
  })

  // Feltöltés közben elveszett kapcsolatnál nem várunk a 60 másodperces időtúllépésre.
  useEffect(() => {
    const onOffline = () => {
      abortedOffline.current = true
      controller.current?.abort()
    }
    window.addEventListener('offline', onOffline)
    return () => window.removeEventListener('offline', onOffline)
  }, [])

  // Feltöltés közben a lap bezárása megszakítaná a fájlküldést: erre figyelmeztet a böngésző.
  const uploading = progress !== null
  useEffect(() => {
    if (!uploading) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [uploading])

  const { mutate, reset } = mutation

  const start = useCallback(
    (file: File) => {
      lastFile.current = file
      if (!navigator.onLine) {
        setOffline(true)
        return
      }
      mutate(file)
    },
    [mutate],
  )

  const retry = useCallback(() => {
    if (lastFile.current) start(lastFile.current)
  }, [start])

  const dismiss = useCallback(() => {
    setOffline(false)
    reset()
  }, [reset])

  const error = offline ? OFFLINE_MESSAGE : mutation.isError && !hideError?.(mutation.error) ? hibaUzenet(mutation.error) : null

  return { progress, start, retry, dismiss, error, offline, data: mutation.data, isError: mutation.isError, failure: mutation.error }
}
