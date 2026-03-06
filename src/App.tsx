import "./styles/index.scss";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./components/Home/Home";
import Header from "./components/Header/Header";
import Drivers from "./components/Drivers/Drivers";
import DriverDetail from "./DriversDetail/DriverDetail";
import LiveTiming from "./LiveTiming/LiveTiming";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Drivers" element={<Drivers />} />
          <Route path="/drivers/:number" element={<DriverDetail />} />
          <Route path="/liveTiming" element={<LiveTiming />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
