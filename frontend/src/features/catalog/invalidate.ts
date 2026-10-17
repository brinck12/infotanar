import type { QueryClient } from '@tanstack/react-query'
import { progressKeys } from '../progress/api'
import { catalogKeys } from './api'

/**
 * Beadás (kód, fájl vagy vizsga) után elavul minden, ami a néző haladását mutatja:
 * a haladás-jelentés, a tanulási utak, a feladatlisták és (ha ismert) maga a feladat.
 */
export function invalidateSolveState(queryClient: QueryClient, taskId?: number): void {
  void queryClient.invalidateQueries({ queryKey: progressKeys.all })
  void queryClient.invalidateQueries({ queryKey: catalogKeys.tracks() })
  void queryClient.invalidateQueries({ queryKey: catalogKeys.taskLists() })
  if (taskId !== undefined) void queryClient.invalidateQueries({ queryKey: catalogKeys.task(taskId) })
}
