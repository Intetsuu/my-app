import "./styles/index.scss";
import { BrowserRouter, Route, Routes } from "react-router";
import Home from "./components/Home/Home";
import Header from "./components/Header/Header";
import Drivers from "./components/Drivers/Drivers";

function App() {
  return (
    <div>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Drivers" element={<Drivers />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
