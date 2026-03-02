import { BrowserRouter, Routes, Route } from "react-router-dom";
import { EraProvider } from "./contexts/EraContext";
import { MqttProvider } from "./contexts/MqttContext";
import Dashboard from "./pages/Dashboard";
import ControlPanel from "./pages/ControlPanel";
import BillManagement from "./pages/BillManagement";
import "./App.css";

function App() {
  return (
    <EraProvider>
      <MqttProvider>
        <BrowserRouter basename={undefined /* Let Vite/Vercel handles root route automagically, or fallback to BASE_URL */}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/control/:acId" element={<ControlPanel />} />
            <Route path="/bills" element={<BillManagement />} />
          </Routes>
        </BrowserRouter>
      </MqttProvider>
    </EraProvider>
  );
}

export default App;
