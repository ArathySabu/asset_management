export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
}

// True only if a token exists and has not expired
export function isLoggedIn() {
  const token = localStorage.getItem("access");
  if (!token) return false;

  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(base64));

    if (payload.exp * 1000 < Date.now()) {
      logout(); // token expired
      return false;
    }
    return true;
  } catch {
    logout(); // token is not valid
    return false;
  }
}