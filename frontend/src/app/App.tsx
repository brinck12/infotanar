import { Suspense, type ReactNode } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAuth, RequireRole } from '../features/auth/guards'
import { NotFound } from '../features/system/NotFound'
import { PageLoader } from '../shared/ui/PageLoader'
import { ErrorBoundary } from './ErrorBoundary'
import { Providers } from './Providers'
import * as Pages from './routes'
import { AccountShell } from './shells/AccountShell'
import { AdminShell } from './shells/AdminShell'
import { AuthShell } from './shells/AuthShell'
import { OfflineNotice, StorageNotice } from './shells/SiteNotices'
import { SiteShell } from './shells/SiteShell'
import { WorkspaceShell } from './shells/WorkspaceShell'

/** Egy keret tartalma: a lusta oldalak betöltése és hibája a kereten belül marad. */
function Framed({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Providers>
          <OfflineNotice />
          <Routes>
            <Route element={<Framed><SiteShell /></Framed>}>
              <Route path="/" element={<Pages.Home />} />
              <Route path="/tanulasi-ut" element={<Pages.LearningPath />} />
              <Route path="/tanulasi-ut/:sav" element={<Pages.TrackPage />} />
              <Route path="/leckek/:id" element={<Pages.LessonPage />} />
              <Route path="/feladatok" element={<Pages.TaskList />} />
              <Route path="/vizsgak" element={<Pages.ExamList />} />
              <Route path="/vizsgak/:id" element={<RequireAuth><Pages.ExamStart /></RequireAuth>} />
              <Route path="/vizsgak/:id/eredmeny" element={<RequireAuth><Pages.ExamResult /></RequireAuth>} />
              <Route path="/beadasok/:id" element={<RequireAuth><Pages.SubmissionPage /></RequireAuth>} />
              <Route path="/szobeli" element={<Pages.Oral />} />
              <Route path="/szobeli/:tema" element={<Pages.OralTopic />} />
              <Route path="/arak" element={<Pages.Pricing />} />
              <Route path="/indulas" element={<Pages.Onboarding />} />
              <Route path="/aszf" element={<Pages.TermsOfService />} />
              <Route path="/adatkezeles" element={<Pages.PrivacyPolicy />} />
              <Route path="/elofizetes" element={<RequireAuth><Pages.Subscribe /></RequireAuth>} />
              <Route path="/elofizetes/visszateres" element={<RequireAuth><Pages.PaymentReturn /></RequireAuth>} />
              <Route path="/haladas" element={<RequireAuth><Pages.ProgressDashboard /></RequireAuth>} />
              <Route path="/fiok" element={<RequireAuth><AccountShell /></RequireAuth>}>
                <Route index element={<Pages.AccountProfile />} />
                <Route path="elofizetes" element={<Pages.AccountSubscription />} />
                <Route path="fizetesek" element={<Pages.AccountPayments />} />
                <Route path="szamlazasi-adatok" element={<Pages.AccountBilling />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>

            <Route element={<Framed><WorkspaceShell /></Framed>}>
              <Route path="/feladatok/:id" element={<Pages.TaskSolve />} />
            </Route>

            {/* A futó vizsgának saját fejléce van (időmérő, beadás), ezért kereten kívül áll. */}
            <Route path="/vizsgak/:id/fut" element={<Framed><RequireAuth><Pages.ExamRunner /></RequireAuth></Framed>} />

            <Route element={<Framed><AuthShell /></Framed>}>
              <Route path="/regisztracio" element={<Pages.Register />} />
              <Route path="/regisztracio/kesz" element={<Pages.RegisterDone />} />
              <Route path="/bejelentkezes" element={<GuestOnly><Pages.Login /></GuestOnly>} />
              <Route path="/email-megerosites" element={<Pages.VerifyEmail />} />
              <Route path="/elfelejtett-jelszo" element={<GuestOnly><Pages.ForgotPassword /></GuestOnly>} />
              <Route path="/jelszo-visszaallitas" element={<Pages.ResetPassword />} />
            </Route>

            <Route path="/admin" element={<RequireRole allow="admin"><Framed><AdminShell /></Framed></RequireRole>}>
              <Route index element={<Pages.AdminOverview />} />
              <Route path="tananyag" element={<Pages.AdminCatalog />} />
              <Route path="tananyag/agak/:trackId" element={<Pages.AdminTrack />} />
              <Route path="tananyag/modulok/:moduleId" element={<Pages.AdminModule />} />
              <Route path="tananyag/leckek/:lessonId" element={<Pages.AdminLesson />} />
              <Route path="tananyag/leckek/:lessonId/uj-feladat" element={<Pages.AdminNewExercise />} />
              <Route path="tananyag/feladatok/:exerciseId" element={<Pages.AdminExercise />} />
              <Route path="vizsgak" element={<Pages.AdminExams />} />
              <Route path="vizsgak/:examId" element={<Pages.AdminExam />} />
              <Route path="felhasznalok" element={<Pages.AdminUsers />} />
              <Route path="felhasznalok/:userId" element={<Pages.AdminUserDetail />} />
              <Route path="szamlak" element={<Pages.AdminInvoices />} />
            </Route>
          </Routes>
          <StorageNotice />
        </Providers>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
