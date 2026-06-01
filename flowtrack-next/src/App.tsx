import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import Dashboard from './pages/Dashboard'
import Registro from './pages/Registro'
import Banche from './pages/Banche'
import Categorie from './pages/Categorie'
import Regole from './pages/Regole'
import Analisi from './pages/Analisi'
import Importazione from './pages/Importazione'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/banche" element={<Banche />} />
          <Route path="/categorie" element={<Categorie />} />
          <Route path="/regole" element={<Regole />} />
          <Route path="/analisi" element={<Analisi />} />
          <Route path="/importazione" element={<Importazione />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
