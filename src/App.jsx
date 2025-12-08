import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { EraProvider } from "./contexts/EraContext";
import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import BillManagement from "./pages/BillManagement";
import "./App.css";

function App() {
  return (
    <LanguageProvider>
      <EraProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control/:acId" element={<ControlPanel />} />
            <Route path="/bills" element={<BillManagement />} />
          </Routes>
        </BrowserRouter>
      </EraProvider>
    </LanguageProvider>
  );
}

export default App;
