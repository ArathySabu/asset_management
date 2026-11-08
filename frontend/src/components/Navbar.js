import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../auth";

function Navbar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function handleLogout() {
    logout(); // removes tokens, username and role
    navigate("/login", { replace: true });
  }

  function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <nav>
      <h2>ASSET MANAGEMENT</h2>

      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search assets, inventory, tickets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
        <button type="button" className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </form>
    </nav>
  );
}

export default Navbar;
