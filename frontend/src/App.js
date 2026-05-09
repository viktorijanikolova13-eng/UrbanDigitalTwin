import logo from './logo.svg';
import './App.css';
import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";
import Home from "./pages/Home";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Prediction from "./pages/Prediction";
import Simulation from "./pages/Simulation";
import Analytics from "./pages/Analytics";
import TrafficModel from "./pages/TrafficModel";

function App() {
  return (
      <BrowserRouter>
          <div className="d-flex flex-column min-vh-100">
              <Navbar />

              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/prediction" element={<Prediction />}/>
                  <Route path="/simulation" element={<Simulation />}/>
                  <Route path="/analytics" element={<Analytics />}/>
                  <Route path="/traffic" element={<TrafficModel />}/>
              </Routes>

              <Footer />
          </div>
      </BrowserRouter>
  );
}

export default App;
