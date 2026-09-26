import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { TaskList } from './pages/TaskList'
import { TaskSolve } from './pages/TaskSolve'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-full flex-col">
        <header className="border-b border-slate-800 bg-slate-900">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
            <Link to="/" className="font-semibold text-slate-100">
              InfoTanár
            </Link>
            <Link to="/feladatok" className="text-sm text-slate-400 transition hover:text-slate-100">
              Feladatok
            </Link>
          </nav>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/feladatok" element={<TaskList />} />
            <Route path="/feladatok/:id" element={<TaskSolve />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
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
