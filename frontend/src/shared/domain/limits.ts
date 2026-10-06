const decimal = new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 2 })

/** Időkorlát másodpercben, pl. 2000 → „2 mp”, 500 → „0,5 mp”. */
export function formatTimeLimit(milliseconds: number): string {
  return `${decimal.format(milliseconds / 1000)} mp`
}

/** Memóriakorlát megabájtban, pl. 128000 → „128 MB”. */
export function formatMemoryLimit(kilobytes: number): string {
  return `${decimal.format(kilobytes / 1000)} MB`
}
