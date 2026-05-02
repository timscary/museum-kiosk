import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/gallery" replace />} />

        <Route path="/home" element={<Home />} />

        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:category" element={<Gallery />} />
        <Route path="/gallery/:category/:sub" element={<Gallery />} />
        <Route path="/gallery/:category/:sub/:section" element={<Gallery />} />

        <Route path="*" element={<Navigate to="/gallery" replace />} />
      </Routes>
    </BrowserRouter>
  );
}