import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import "./AiChat.css"; // contains the .ai-fab button style

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/dashboard/");
        setStats(res.data);
      } catch (err) {
        console.error(err);
        setError("Could not load dashboard data");
      }
    };

    load();
    const timer = setInterval(load, 30000); // refresh every 30 seconds
    return () => clearInterval(timer);
  }, []);

  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <p>Welcome to Asset Management, {localStorage.getItem("username")}!</p>

      <div className="dashboard-cards">
        <div className="card">
          <h3>Total Assets</h3>
          <h2>{stats.total_assets}</h2>
        </div>

        <div className="card">
          <h3>Inventory Items</h3>
          <h2>{stats.inventory_items}</h2>
        </div>

        <div className="card">
          <h3>Open Tickets</h3>
          <h2>{stats.open_tickets}</h2>
        </div>

        <div className="card">
          <h3>Available Assets</h3>
          <h2>{stats.available_assets}</h2>
        </div>
      </div>

      {stats.low_stock_items?.length > 0 && (
        <>
          <h2>Low stock</h2>
          <table className="inventory-table">
            <thead>
              <tr><th>Item</th><th>Quantity</th><th>Limit</th></tr>
            </thead>
            <tbody>
              {stats.low_stock_items.map((i) => (
                <tr key={i.item_type}>
                  <td>{i.item_type}</td><td>{i.quantity}</td><td>{i.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <button
        type="button"
        className="ai-fab"
        onClick={() => navigate("/ai-chat")}
      >
        Ask AI
      </button>
    </div>
  );
}

export default Dashboard;