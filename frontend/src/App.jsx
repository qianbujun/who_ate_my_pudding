import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Game from './pages/Game'
import Menu from './pages/Menu'
import History from './pages/History'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/menu" element={<Menu />} />
      <Route path="/history" element={<History />} />
      <Route path="/game" element={<Game />} />
    </Routes>
  )
}

export default App
