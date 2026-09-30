/** Mentés visszajelzése a szakasz fejlécében (élő régió, hogy a képernyőolvasó is jelezze). */
export function SavedNote({ mutation }: { mutation: { isSuccess: boolean; isPending: boolean } }) {
  return (
    <span role="status" className="text-xs text-emerald-300">
      {mutation.isSuccess && !mutation.isPending ? 'Mentve ✓' : ''}
    </span>
  )
}
