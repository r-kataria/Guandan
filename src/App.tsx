import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './pages/Home'
import { Play } from './pages/Play'
import { Online } from './pages/Online'
import { Learn } from './pages/Learn'
import { Lesson } from './pages/Lesson'
import { Reference } from './pages/Reference'
import { ThemeSwitcher } from './components/ThemeSwitcher'

export function App() {
  return (
    <div className="app-shell">
      <nav className="nav">
        <NavLink to="/" className="brand">
          Guandan<span className="cn">掼蛋</span>
        </NavLink>
        <div className="spacer" />
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <NavLink to="/learn" className={({ isActive }) => (isActive ? 'active' : '')}>
          Learn
        </NavLink>
        <NavLink to="/play" className={({ isActive }) => (isActive ? 'active' : '')}>
          Play
        </NavLink>
        <NavLink to="/online" className={({ isActive }) => (isActive ? 'active' : '')}>
          Online
        </NavLink>
        <NavLink to="/reference" className={({ isActive }) => (isActive ? 'active' : '')}>
          Reference
        </NavLink>
        <ThemeSwitcher />
      </nav>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/online" element={<Online />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/learn/:id" element={<Lesson />} />
          <Route path="/reference" element={<Reference />} />
        </Routes>
      </main>
    </div>
  )
}
