import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Change this to match your Django server (or reuse the base URL from your api.js)
const API_URL = "/api/profile/";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("access")}`,
  };
}

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", age: "", phone: "", department: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function fillForm(data) {
    setForm({
      name: data.name || "",
      age: data.age ?? "",
      phone: data.phone || "",
      department: data.department || "",
    });
  }

  // Load the profile of whoever is logged in (identified by their token)
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(API_URL, { headers: authHeaders() });

        if (res.status === 401) {
          // token missing or expired
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          navigate("/login", { replace: true });
          return;
        }
        if (!res.ok) throw new Error("Could not load profile");

        const data = await res.json();
        setUser(data);
        fillForm(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [navigate]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim() || !form.department.trim() || form.age === "") {
      alert("Please fill all fields");
      return;
    }
    if (Number(form.age) < 1 || Number(form.age) > 120) {
      alert("Enter a valid age");
      return;
    }
    if (!/^\d{10}$/.test(form.phone)) {
      alert("Phone number must be 10 digits");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });

      if (!res.ok) throw new Error("Could not save changes");

      const data = await res.json();
      setUser(data);
      fillForm(data);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message);
    }
  }

  function handleCancel() {
    fillForm(user);
    setIsEditing(false);
  }

  if (loading) return <p>Loading profile...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!user) return null;

  return (
    <div className="page-container">
      <h2>My Profile</h2>

      <div className="profile-card">
        <div className="profile-icon">
          {(user.name || user.username || "?").charAt(0).toUpperCase()}
        </div>

        <h3>{user.name || user.username}</h3>
        <p>{user.email}</p>

        <form onSubmit={handleSave}>
          <label>Username</label>
          <input type="text" value={user.username} disabled />

          <label>Full Name</label>
          <input name="name" type="text" value={form.name} disabled={!isEditing} onChange={handleChange} />

          <label>Age</label>
          <input name="age" type="number" min="1" max="120" value={form.age} disabled={!isEditing} onChange={handleChange} />

          <label>Email</label>
          <input type="email" value={user.email} disabled />

          <label>Phone Number</label>
          <input name="phone" type="tel" value={form.phone} disabled={!isEditing} onChange={handleChange} />

          <label>Department</label>
          <input name="department" type="text" value={form.department} disabled={!isEditing} onChange={handleChange} />

          {isEditing ? (
            <>
              <button type="submit">Save Changes</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
            </>
          ) : (
            <button type="button" onClick={() => setIsEditing(true)}>Edit Profile</button>
          )}
        </form>
      </div>
    </div>
  );
}

// Export only the component. No BrowserRouter here.
export default Profile;