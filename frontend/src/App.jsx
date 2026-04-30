import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { PublicHomePage } from "./pages/PublicHomePage";
import { LoginPage } from "./pages/LoginPage";
import { DataCollectorPage } from "./pages/DataCollectorPage";
import { PreprocessingPage } from "./pages/PreprocessingPage";
import { ProcessingPage } from "./pages/ProcessingPage";
import { TestingPage } from "./pages/TestingPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { SettingsPage } from "./pages/SettingsPage";

// Simple Protected Route Check
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("antihoax_token");
  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PublicHomePage />} />

        {/* Auth Route */}
        <Route path="/admin/login" element={<LoginPage />} />

        {/* Admin Routes with Layout Wrapper */}
        <Route path="/admin" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="collector" replace />} />
          <Route path="collector" element={<DataCollectorPage />} />
          <Route path="preprocessing" element={<PreprocessingPage />} />
          <Route path="processing" element={<ProcessingPage />} />
          <Route path="testing" element={<TestingPage />} />
          <Route path="evaluation" element={<EvaluationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
