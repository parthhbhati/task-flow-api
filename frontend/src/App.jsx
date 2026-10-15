import { useEffect, useState } from "react";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import { checkApiHealth } from "./lib/apiTest";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  useEffect(() => {
    checkApiHealth()
      .then((data) => console.log("API connected:", data))
      .catch((error) => console.error("API connection failed:", error));
  }, []);

  return (
    <AppLayout activePage={activePage} onNavigate={setActivePage}>
      <Dashboard activePage={activePage} onNavigate={setActivePage} />
    </AppLayout>
  );
}

export default App;
