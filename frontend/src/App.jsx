import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { checkApiHealth } from "./lib/apiTest";

function DashboardPage() {
  return (
    <AppLayout>
      <Dashboard />
    </AppLayout>
  );
}

function App() {
  useEffect(() => {
    checkApiHealth()
      .then((data) => console.log("API connected:", data))
      .catch((error) => console.error("API connection failed:", error));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
