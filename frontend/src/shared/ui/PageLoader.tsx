import { Skeleton } from './States'

export function PageLoader({ label = 'Betöltés…' }: { label?: string }) {
  return (
    <div className="mx-auto w-full max-w-page px-4 py-12 md:px-6">
      <Skeleton lines={4} label={label} className="max-w-prose" />
    </div>
  )
}
