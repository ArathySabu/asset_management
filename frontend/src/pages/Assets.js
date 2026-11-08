import { useEffect, useState } from "react";
import api from "../api";
import "./Assets.css";

const empty = { name: "", type: "", serial_number: "", status: "Available", purchase_date: "" };

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const isAdmin = localStorage.getItem("role") === "Admin";

  const load = async () => {
    try {
      const res = await api.get("/assets/", { params: { page, search, status } });
      setAssets(res.data.results);   // paginated response
      setCount(res.data.count);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, [page, search, status]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editId) await api.put(`/assets/${editId}/`, form);
      else await api.post("/assets/", form);
      setForm(empty); setEditId(null); load();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this asset?")) return;
    await api.delete(`/assets/${id}/`);
    load();
  };

  const totalPages = Math.ceil(count / 10) || 1;

  // "In Repair" -> "in-repair" (used for the status badge colour)
  const badgeClass = (s) => "badge " + String(s).toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="assets-page">
      <h2>Assets</h2>

      <div className="assets-toolbar">
        <input
          type="search"
          placeholder="Search name / serial"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option>Available</option>
          <option>Assigned</option>
          <option>In Repair</option>
        </select>
        <span className="assets-count">{count} {count === 1 ? "asset" : "assets"}</span>
      </div>

      {isAdmin && (
        <form className="assets-form" onSubmit={save}>
          <h3>{editId ? "Edit asset" : "Add asset"}</h3>
          <div className="assets-form-fields">
            <input placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input placeholder="type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required />
            <input placeholder="serial number" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} required />
            <input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} required />
            <button type="submit" className="btn-primary">{editId ? "Update" : "Add"}</button>
          </div>
        </form>
      )}

      <div className="assets-table-wrap">
        <table className="assets-table">
          <thead>
            <tr>
              <th>Name</th><th>Type</th><th>Serial</th><th>Status</th><th>Purchased</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {assets.length === 0 && (
              <tr>
                <td className="assets-empty" colSpan={isAdmin ? 6 : 5}>No assets found.</td>
              </tr>
            )}
            {assets.map((a) => (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>{a.type}</td>
                <td>{a.serial_number}</td>
                <td><span className={badgeClass(a.status)}>{a.status}</span></td>
                <td>{a.purchase_date}</td>
                {isAdmin && (
                  <td className="assets-actions">
                    <button className="btn-edit" onClick={() => { setEditId(a.id); setForm(a); window.scrollTo({ top: 0, behavior: "smooth" }); }}>Edit</button>
                    <button className="btn-delete" onClick={() => remove(a.id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="assets-pagination">
        <button disabled={page === 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
    </div>
  );
}