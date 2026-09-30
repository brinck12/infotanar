import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App'

const container = document.getElementById('root')
if (!container) throw new Error('Hiányzik a #root elem az index.html-ből.')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
