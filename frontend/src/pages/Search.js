import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";

// Handles both plain lists and paginated ({ results: [...] }) responses
const toList = (d) => (Array.isArray(d) ? d : d?.results || []);

function Search() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim();

  const [assets, setAssets] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!q) return;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const opts = { params: { search: q, page_size: 20 } };
        const [a, i, t] = await Promise.all([
          api.get("/assets/", opts),
          api.get("/inventory/", opts),
          api.get("/tickets/", opts),
        ]);
        if (cancelled) return;
        setAssets(toList(a.data));
        setInventory(toList(i.data));
        setTickets(toList(t.data));
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Search failed. Check that the Django server is running.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [q]);

  if (!q) return <p>Type something in the search box above.</p>;

  const total = assets.length + inventory.length + tickets.length;

  return (
    <div className="inventory-page">
      <h1>Search results for "{q}"</h1>
      {loading && <p>Searching...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!loading && !error && total === 0 && <p>Nothing found.</p>}

      {assets.length > 0 && (
        <>
          <h2>Assets ({assets.length}) — <Link to="/assets">open Assets</Link></h2>
          <table className="inventory-table">
            <thead>
              <tr><th>Name</th><th>Type</th><th>Serial</th><th>Status</th></tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td><td>{a.type}</td><td>{a.serial_number}</td><td>{a.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {inventory.length > 0 && (
        <>
          <h2>Inventory ({inventory.length}) — <Link to="/inventory">open Inventory</Link></h2>
          <table className="inventory-table">
            <thead>
              <tr><th>Item</th><th>Category</th><th>Quantity</th></tr>
            </thead>
            <tbody>
              {inventory.map((i) => (
                <tr key={i.id}>
                  <td>{i.item_type}</td><td>{i.category}</td><td>{i.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tickets.length > 0 && (
        <>
          <h2>Tickets ({tickets.length}) — <Link to="/tickets">open Tickets</Link></h2>
          <table className="inventory-table">
            <thead>
              <tr><th>Asset</th><th>Issue</th><th>Status</th><th>Technician</th></tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.asset_name}</td><td>{t.issue}</td><td>{t.status}</td><td>{t.technician_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Search;
