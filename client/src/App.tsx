import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationsPage from './pages/ApplicationsPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import EvidencePage from './pages/EvidencePage';
import AssessmentPage from './pages/AssessmentPage';
import IssuesPage from './pages/IssuesPage';
import DecisionPage from './pages/DecisionPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/applications" element={<ApplicationsPage />} />
        <Route path="/applications/:id" element={<ApplicationDetailPage />} />
        <Route path="/evidence" element={<EvidencePage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/issues" element={<IssuesPage />} />
        <Route path="/decision" element={<DecisionPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}