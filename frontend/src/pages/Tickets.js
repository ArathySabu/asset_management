import { useState, useEffect, useCallback } from "react";
import api from "../api";

const STATUSES = ["Pending", "In Progress", "Resolved"];
const empty = { asset: "", issue: "", status: "Pending", assigned_technician: "" };

const toList = (d) => (Array.isArray(d) ? d : d?.results || []);

function Tickets() {
  const isAdmin = localStorage.getItem("role") === "Admin";

  const [tickets, setTickets] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [assets, setAssets] = useState([]);   // for the Asset dropdown
  const [users, setUsers] = useState([]);     // for the Technician dropdown

  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await api.get("/tickets/", {
        params: { page, search, status: statusFilter },
      });
      setTickets(res.data.results);
      setCount(res.data.count);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load tickets from the server.");
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  // Dropdown data (asset list can change after a ticket changes its status)
  const loadDropdowns = useCallback(async () => {
    try {
      const [a, u] = await Promise.all([
        api.get("/assets/", { params: { page_size: 200 } }),
        api.get("/users/"),
      ]);
      setAssets(toList(a.data));
      setUsers(toList(u.data));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadDropdowns();
  }, [isAdmin, loadDropdowns]);

  function clearForm() {
    setForm(empty);
    setEditId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.asset || form.issue.trim() === "" || !form.assigned_technician) {
      alert("Please choose an asset, describe the issue and pick a technician");
      return;
    }

    const payload = {
      asset: Number(form.asset),
      issue: form.issue.trim(),
      status: form.status,
      assigned_technician: Number(form.assigned_technician),
    };

    try {
      if (editId !== null) await api.put(`/tickets/${editId}/`, payload);
      else await api.post("/tickets/", payload);
      clearForm();
      setPage(1);
      load();
      loadDropdowns();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  }

  function handleEdit(t) {
    setForm({
      asset: String(t.asset),
      issue: t.issue,
      status: t.status,
      assigned_technician: String(t.assigned_technician),
    });
    setEditId(t.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    try {
      await api.delete(`/tickets/${id}/`);
      if (tickets.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  }

  const totalPages = Math.ceil(count / 10) || 1;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="page-container">
      <h2>Ticket Management</h2>

      {isAdmin && (
        <form className="ticket-form" onSubmit={handleSubmit}>
          <select value={form.asset} onChange={set("asset")}>
            <option value="">Select asset</option>
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.serial_number})
              </option>
            ))}
          </select>

          <textarea placeholder="Describe the issue" value={form.issue} onChange={set("issue")} />

          <select value={form.assigned_technician} onChange={set("assigned_technician")}>
            <option value="">Select technician</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.username}</option>
            ))}
          </select>

          <select value={form.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <button type="submit">{editId !== null ? "Update Ticket" : "Add Ticket"}</button>
          {editId !== null && (
            <button type="button" onClick={clearForm}>Cancel</button>
          )}
        </form>
      )}

      <h3>All Tickets ({count})</h3>

      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <input
          type="search"
          placeholder="Search issue / asset"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ padding: 8 }}
        />
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table className="ticket-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Asset</th>
            <th>Issue</th>
            <th>Technician</th>
            <th>Status</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {tickets.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5}>No tickets found.</td>
            </tr>
          )}
          {tickets.map((t) => (
            <tr key={t.id}>
              <td>{t.id}</td>
              <td>{t.asset_name}</td>
              <td>{t.issue}</td>
              <td>{t.technician_name}</td>
              <td>{t.status}</td>
              {isAdmin && (
                <td>
                  <button onClick={() => handleEdit(t)}>Edit</button>
                  <button onClick={() => handleDelete(t.id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span style={{ margin: "0 10px" }}>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}

export default Tickets;
