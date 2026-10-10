import { ButtonLink } from '../../shared/ui/Button'
import { ErrorPage } from './ErrorPage'

export function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Ez az oldal nem található"
      actions={
        <>
          <ButtonLink to="/">Kezdőlap</ButtonLink>
          <ButtonLink to="/tanulasi-ut" variant="secondary">
            Tanulási út
          </ButtonLink>
        </>
      }
    >
      Lehet, hogy a cím elírt, vagy az oldal megszűnt. A kezdőlapról vagy a tanulási útról megtalálod, amit keresel.
    </ErrorPage>
  )
}

export function Forbidden() {
  return (
    <ErrorPage code="403" title="Ehhez nincs jogosultságod" actions={<ButtonLink to="/">Kezdőlap</ButtonLink>}>
      Ez az oldal csak adminoknak érhető el. Ha szerinted tévedés, jelezd nekünk.
    </ErrorPage>
  )
}
