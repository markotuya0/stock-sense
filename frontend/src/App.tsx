import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { AuthGuard } from './components/guards/AuthGuard';
import { StockDetailPage } from './pages/StockDetailPage';
import { AccuracyPage } from './pages/AccuracyPage';
import { SettingsPage } from './pages/SettingsPage';
import { PortfolioPage } from './pages/PortfolioPage';

function App() {
  return (
    <Router>
      <div className="bg-background text-foreground selection:bg-accent/30 selection:text-accent">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<AuthGuard><DashboardPage /></AuthGuard>} />
          <Route path="/stock/:symbol" element={<AuthGuard><StockDetailPage /></AuthGuard>} />
          <Route path="/accuracy" element={<AccuracyPage />} />
          <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
          <Route path="/portfolio" element={<AuthGuard><PortfolioPage /></AuthGuard>} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
