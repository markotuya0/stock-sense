import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <Router>
      <div className="bg-background text-foreground selection:bg-accent/30 selection:text-accent">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/login" element={<div className="h-screen flex items-center justify-center">Login coming soon</div>} />
          <Route path="/signup" element={<div className="h-screen flex items-center justify-center">Signup coming soon</div>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
