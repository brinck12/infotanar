import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { AccountNav, VerifyEmailBanner } from './components/AccountNav'
import { Home } from './pages/Home'
import { ForgotPassword } from './pages/auth/ForgotPassword'
import { Login } from './pages/auth/Login'
import { Register } from './pages/auth/Register'
import { RegisterDone } from './pages/auth/RegisterDone'
import { ResetPassword } from './pages/auth/ResetPassword'
import { VerifyEmail } from './pages/auth/VerifyEmail'
import { TaskList } from './pages/TaskList'
import { TaskSolve } from './pages/TaskSolve'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/feladatok" element={<TaskList />} />
              <Route path="/feladatok/:id" element={<TaskSolve />} />
              <Route path="/regisztracio" element={<Register />} />
              <Route path="/regisztracio/kesz" element={<RegisterDone />} />
              <Route path="/bejelentkezes" element={<Login />} />
              <Route path="/email-megerosites" element={<VerifyEmail />} />
              <Route path="/elfelejtett-jelszo" element={<ForgotPassword />} />
              <Route path="/jelszo-visszaallitas" element={<ResetPassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
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
