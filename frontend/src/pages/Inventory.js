import { useState, useEffect, useCallback } from "react";
import api from "../api";

const empty = { item_type: "", category: "", quantity: "", threshold: 5 };

function Inventory() {
  const isAdmin = localStorage.getItem("role") === "Admin";

  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState("");

  // Everything below reads from / writes to Django, so the dashboard,
  // the database and the AI chat all see the same data.
  const load = useCallback(async () => {
    try {
      const [list, dash] = await Promise.all([
        api.get("/inventory/", { params: { page, search } }),
        api.get("/dashboard/"),
      ]);
      setItems(list.data.results);
      setCount(list.data.count);
      setTotalStock(dash.data.inventory_items);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Could not load inventory from the server.");
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  function clearForm() {
    setForm(empty);
    setEditId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const qty = Number(form.quantity);
    const threshold = Number(form.threshold);
    if (form.item_type.trim() === "" || form.category.trim() === "" || form.quantity === "") {
      alert("Please fill all fields");
      return;
    }
    if (!Number.isInteger(qty) || qty < 0 || !Number.isInteger(threshold) || threshold < 0) {
      alert("Quantity and low-stock limit must be whole numbers (0 or more)");
      return;
    }

    const payload = {
      item_type: form.item_type.trim(),
      category: form.category.trim(),
      quantity: qty,
      threshold,
    };

    try {
      if (editId !== null) await api.put(`/inventory/${editId}/`, payload);
      else await api.post("/inventory/", payload);
      clearForm();
      setPage(1);
      load();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  }

  function handleEdit(item) {
    setForm({
      item_type: item.item_type,
      category: item.category || "",
      quantity: String(item.quantity),
      threshold: item.threshold,
    });
    setEditId(item.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    try {
      await api.delete(`/inventory/${id}/`);
      if (editId === id) clearForm();
      // if that was the last row on this page, go back one page
      if (items.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      alert(JSON.stringify(err.response?.data || err.message));
    }
  }

  const totalPages = Math.ceil(count / 10) || 1;
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  return (
    <div className="inventory-page">
      <h1>Inventory Management</h1>

      {isAdmin && (
        <>
          <h2>{editId !== null ? "Edit Item" : "Add New Item"}</h2>

          <form className="inventory-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Item Name" value={form.item_type} onChange={set("item_type")} />
            <input type="text" placeholder="Category" value={form.category} onChange={set("category")} />
            <input type="number" placeholder="Quantity" min="0" step="1" value={form.quantity} onChange={set("quantity")} />
            <input type="number" placeholder="Low-stock limit" min="0" step="1" value={form.threshold} onChange={set("threshold")} />

            <button type="submit">{editId !== null ? "Update Item" : "Add Item"}</button>
            {editId !== null && (
              <button type="button" onClick={clearForm}>Cancel</button>
            )}
          </form>
        </>
      )}

      <h2>Inventory List</h2>

      <input
        type="search"
        placeholder="Search item / category"
        value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        style={{ padding: 10, border: "1px solid #cbd5e1", borderRadius: 5 }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <table className="inventory-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Availability</th>
            {isAdmin && <th>Actions</th>}
          </tr>
        </thead>

        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={isAdmin ? 6 : 5}>No items found.</td>
            </tr>
          )}

          {items.map((item) => (
            <tr key={item.id}>
              <td>{item.id}</td>
              <td>{item.item_type}</td>
              <td>{item.category}</td>
              <td>{item.quantity}</td>
              <td>
                {item.quantity === 0
                  ? "Out of Stock"
                  : item.is_low_stock
                  ? "Low Stock"
                  : "In Stock"}
              </td>
              {isAdmin && (
                <td>
                  <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
                  <button className="delete-btn" onClick={() => handleDelete(item.id)}>Delete</button>
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

      <h3 className="total-stock">Total Stock: {totalStock}</h3>
    </div>
  );
}

export default Inventory;
