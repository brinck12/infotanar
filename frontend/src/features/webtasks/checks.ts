import type { RubricState } from '../../shared/ui/RubricItem'
import type { WebCheck, WebTaskInfo } from '../../types'

export interface WebCheckResult {
  check: WebCheck
  state: RubricState
  found: string
}

type Files = ReadonlyMap<string, string>

function parse(html: string): Document {
  return new DOMParser().parseFromString(html, 'text/html')
}

/** A megadott HTML fájl; név nélkül az első HTML fájl. */
function htmlOf(task: WebTaskInfo, files: Files, name?: string): string {
  const file = name ?? task.files.find((item) => item.language === 'html')?.name ?? ''
  return files.get(file) ?? ''
}

function cssOf(task: WebTaskInfo, files: Files): string {
  return task.files
    .filter((item) => item.language === 'css')
    .map((item) => files.get(item.name) ?? '')
    .join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '')
}

function safeCount(document: Document, selector: string): number {
  try {
    return document.querySelectorAll(selector).length
  } catch {
    return 0
  }
}

function evaluate(check: WebCheck, task: WebTaskInfo, files: Files): { passed: boolean; found: string } {
  switch (check.type) {
    case 'title': {
      const title = parse(htmlOf(task, files)).title.trim()
      return { passed: title === check.value, found: title ? `<title>${title}</title>` : 'Nincs <title> elem' }
    }
    case 'element_count': {
      const count = safeCount(parse(htmlOf(task, files, check.file)), check.selector)
      return { passed: count === check.count, found: `${count} darab ${check.selector}` }
    }
    case 'css_declaration': {
      const css = cssOf(task, files)
      const declaration = new RegExp(`${check.property}\\s*:\\s*([^;}]+)`, 'i').exec(css)?.[1]?.trim()
      let matches = false
      try {
        matches = declaration !== undefined && new RegExp(check.pattern, 'i').test(declaration)
      } catch {
        matches = false
      }
      return { passed: matches, found: declaration ? `${check.property}: ${declaration}` : `Nincs ${check.property} megadva` }
    }
    case 'css_selector': {
      const escaped = check.selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const present = new RegExp(`(^|[\\s,}])${escaped}\\s*[,{]`).test(cssOf(task, files))
      return { passed: present, found: present ? `${check.selector} { … }` : `Nincs ${check.selector} szabály` }
    }
    case 'link': {
      const document = parse(htmlOf(task, files, check.file))
      const present = [...document.querySelectorAll('a[href]')].some((link) => link.getAttribute('href') === check.href)
      return { passed: present, found: present ? `<a href="${check.href}">` : `Nincs hivatkozás erre: ${check.href}` }
    }
  }
}

/** Az ellenőrzőlista kiértékelése a szerkesztő aktuális tartalmán. */
export function runWebChecks(task: WebTaskInfo, files: Files): WebCheckResult[] {
  return task.checks.map((check) => {
    const { passed, found } = evaluate(check, task, files)
    return { check, state: passed ? 'ok' : 'bad', found }
  })
}

/**
 * Az előnézet dokumentuma: a HTML-be beágyazzuk a hivatkozott stíluslapokat,
 * mert a homokozóba zárt keret nem tölthet be külön fájlt.
 */
export function previewDocument(files: Files, htmlName: string): string {
  const document = parse(files.get(htmlName) ?? '')
  for (const link of [...document.querySelectorAll('link[rel="stylesheet"]')]) {
    const css = files.get(link.getAttribute('href') ?? '')
    if (css === undefined) continue
    const style = document.createElement('style')
    style.textContent = css
    link.replaceWith(style)
  }
  // A keret homokozóban fut: szkript nem indulhat, de a tartalom se tartalmazzon.
  for (const script of [...document.querySelectorAll('script')]) script.remove()
  return `<!doctype html>${document.documentElement.outerHTML}`
}
