import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import LanguageSwitcher from './components/LanguageSwitcher';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MoodCheck from './pages/MoodCheck';
// import Counsellor from './pages/Counsellor';
import Music from './pages/Music';
import Games from './pages/Games';
import GamePlay from './pages/GamePlay';
import Quotes from './pages/Quotes';
import Journal from './pages/Journal';
import Goals from './pages/Goals';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="app-shell">
      {isAuthenticated && <Navbar />}
      {isAuthenticated && <div className="mobile-lang"><LanguageSwitcher compact /></div>}
      <div className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/mood" element={<ProtectedRoute><MoodCheck /></ProtectedRoute>} />

          <Route path="/music" element={<ProtectedRoute><Music /></ProtectedRoute>} />
          <Route path="/games" element={<ProtectedRoute><Games /></ProtectedRoute>} />
          <Route path="/games/:gameType" element={<ProtectedRoute><GamePlay /></ProtectedRoute>} />
          <Route path="/quotes" element={<ProtectedRoute><Quotes /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
          <Route path="/goals" element={<ProtectedRoute><Goals /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
}
