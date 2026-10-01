import { Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { VerifyEmailBanner } from '../features/auth/components/VerifyEmailBanner'
import { GuestOnly, RequireAuth, RequireRole } from '../features/auth/guards'
import { PastDueBanner } from '../features/billing/components/PastDueBanner'
import { LEGAL_DOCUMENTS } from '../features/legal/documents'
import { CookieBanner } from '../shared/consent/CookieBanner'
import { PageLoader } from '../shared/ui/PageLoader'
import { ErrorBoundary } from './ErrorBoundary'
import { Footer } from './Footer'
import { Header } from './Header'
import { Providers } from './Providers'
import * as Pages from './routes'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Providers>
          <div className="flex min-h-full flex-col">
            {/* Billentyűzettel az első Tab ide lép: a menü átugorható. Csak fókuszban látszik. */}
            <a
              href="#tartalom"
              className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-sky-700 focus:px-4 focus:py-2 focus:text-white"
            >
              Ugrás a tartalomra
            </a>
            <Header />
            <VerifyEmailBanner />
            <PastDueBanner />

            <main id="tartalom" tabIndex={-1} className="flex-1 focus:outline-none">
              <ErrorBoundary>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Pages.Home />} />
                    <Route path="/tananyag" element={<Pages.Curriculum />} />
                    <Route path="/tananyag/:trackSlug" element={<Pages.TrackPage />} />
                    <Route path="/feladatok" element={<Pages.TaskList />} />
                    <Route path="/feladatok/:id" element={<Pages.TaskSolve />} />
                    <Route path="/regisztracio" element={<Pages.Register />} />
                    <Route path="/regisztracio/kesz" element={<Pages.RegisterDone />} />
                    <Route path="/bejelentkezes" element={<GuestOnly><Pages.Login /></GuestOnly>} />
                    <Route path="/email-megerosites" element={<Pages.VerifyEmail />} />
                    <Route path="/elfelejtett-jelszo" element={<GuestOnly><Pages.ForgotPassword /></GuestOnly>} />
                    <Route path="/jelszo-visszaallitas" element={<Pages.ResetPassword />} />
                    <Route path="/elofizetes" element={<RequireAuth><Pages.Subscribe /></RequireAuth>} />
                    <Route path="/elofizetes/visszateres" element={<RequireAuth><Pages.PaymentReturn /></RequireAuth>} />
                    <Route path="/haladas" element={<RequireAuth><Pages.ProgressDashboard /></RequireAuth>} />
                    <Route path="/fiok" element={<RequireAuth><Pages.Account /></RequireAuth>} />
                    <Route path="/email-csere" element={<Pages.EmailChangeConfirm />} />
                    <Route path={LEGAL_DOCUMENTS.terms.path} element={<Pages.Terms />} />
                    <Route path={LEGAL_DOCUMENTS.privacy.path} element={<Pages.Privacy />} />
                    <Route path={LEGAL_DOCUMENTS.imprint.path} element={<Pages.Imprint />} />
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
                      <Route path="szamlak" element={<Pages.AdminInvoices />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <CookieBanner />
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
