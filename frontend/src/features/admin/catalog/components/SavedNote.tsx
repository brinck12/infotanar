import { Icon } from '../../../../shared/ui/Icon'

/** Mentés visszajelzése a szakasz fejlécében (élő régió, hogy a képernyőolvasó is jelezze). */
export function SavedNote({ mutation }: { mutation: { isSuccess: boolean; isPending: boolean } }) {
  const saved = mutation.isSuccess && !mutation.isPending

  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-14 font-semibold text-accent">
      {saved && (
        <>
          <Icon name="check" size={16} />
          Mentve
        </>
      )}
    </span>
  )
}
