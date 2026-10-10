import { Outlet } from 'react-router-dom'
import { Logo } from '../../shared/ui/Logo'
import { SiteFooter } from './SiteFooter'

/** Belépés, regisztráció, jelszókezelés: logó, egy középre zárt kártya, lábléc. */
export function AuthShell() {
  return (
    <>
      <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6">
        <Logo />
      </header>
      <main className="mx-auto w-full max-w-auth flex-1 px-4 pt-8 pb-24 md:px-0">
        <Outlet />
      </main>
      <SiteFooter />
    </>
  )
}
