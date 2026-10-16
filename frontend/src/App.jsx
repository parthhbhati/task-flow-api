import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./components/layout/AppLayout";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import { checkApiHealth } from "./lib/apiTest";

function DashboardPage() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [createTaskRequest, setCreateTaskRequest] = useState(0);

  const handleNavigate = (page) => {
    setActivePage(page);
    if (page === "Create Task") {
      setCreateTaskRequest((request) => request + 1);
    }
  };

  return (
    <AppLayout activePage={activePage} onNavigate={handleNavigate}>
      <Dashboard
        activePage={activePage}
        onNavigate={handleNavigate}
        createTaskRequest={createTaskRequest}
      />
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
