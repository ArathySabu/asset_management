import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Inventory from "./pages/Inventory";
import Tickets from "./pages/Tickets";
import Profile from "./pages/Profile";
import { isLoggedIn } from "./auth";
import AiChat from "./pages/AiChat";
import Search from "./pages/Search";


function Layout() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      <div className="main-layout">
        <Sidebar />
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/ai-chat" element={<AiChat />} />
          <Route path="/search" element={<Search />} />
          
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;