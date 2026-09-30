import { Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AccountNav, VerifyEmailBanner } from '../features/auth/components/AccountNav'
import { GuestOnly, RequireAuth, RequireRole } from '../features/auth/guards'
import { PageLoader } from '../shared/ui/PageLoader'
import { ErrorBoundary } from './ErrorBoundary'
import { Providers } from './Providers'
import * as Pages from './routes'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Providers>
          <div className="flex min-h-full flex-col">
            <header className="border-b border-slate-800 bg-slate-900">
              <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
                <Link to="/" className="font-semibold text-slate-100">
                  InfoTanár
                </Link>
                <Link to="/feladatok" className="text-sm text-slate-400 transition hover:text-slate-100">
                  Feladatok
                </Link>
                <AccountNav />
              </nav>
            </header>
            <VerifyEmailBanner />

            <main className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Pages.Home />} />
                    <Route path="/feladatok" element={<Pages.TaskList />} />
                    <Route path="/feladatok/:id" element={<Pages.TaskSolve />} />
                    <Route path="/regisztracio" element={<Pages.Register />} />
                    <Route path="/regisztracio/kesz" element={<Pages.RegisterDone />} />
                    <Route path="/bejelentkezes" element={<GuestOnly><Pages.Login /></GuestOnly>} />
                    <Route path="/email-megerosites" element={<Pages.VerifyEmail />} />
                    <Route path="/elfelejtett-jelszo" element={<GuestOnly><Pages.ForgotPassword /></GuestOnly>} />
                    <Route path="/jelszo-visszaallitas" element={<Pages.ResetPassword />} />
                    <Route path="/elofizetes" element={<RequireAuth><Pages.Subscribe /></RequireAuth>} />
                    <Route path="/haladas" element={<RequireAuth><Pages.ProgressDashboard /></RequireAuth>} />
                    <Route path="/admin" element={<RequireRole allow="admin"><Outlet /></RequireRole>}>
                      <Route index element={<Navigate to="/admin/tananyag" replace />} />
                      <Route path="tananyag" element={<Pages.AdminCatalog />} />
                      <Route path="tananyag/agak/:trackId" element={<Pages.AdminTrack />} />
                      <Route path="tananyag/modulok/:moduleId" element={<Pages.AdminModule />} />
                      <Route path="tananyag/leckek/:lessonId" element={<Pages.AdminLesson />} />
                      <Route path="tananyag/leckek/:lessonId/uj-feladat" element={<Pages.AdminNewExercise />} />
                      <Route path="tananyag/feladatok/:exerciseId" element={<Pages.AdminExercise />} />
                      <Route path="felhasznalok" element={<Pages.AdminUsers />} />
                      <Route path="felhasznalok/:userId" element={<Pages.AdminUserDetail />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
        </Providers>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

function NotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-xl font-semibold text-slate-100">A keresett oldal nem található</h1>
      <Link to="/" className="mt-4 inline-block text-sky-400 hover:underline">
        Vissza a kezdőlapra
      </Link>
    </div>
  )
}
