import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ShieldAlert } from "lucide-react";

export function LoginPage() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("antihoax_token", data.access_token);
        navigate("/admin/collector");
      } else {
        const err = await res.json();
        setError(err.detail || "Login failed");
      }
    } catch (e) {
      setError("Server inaccessible");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white max-w-md w-full rounded-3xl p-8 shadow-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="inline-flex p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Admin Login</h2>
          <p className="text-slate-500 text-sm">Sign in to AntiHOAX Management</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-sm font-medium">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Username</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 block mb-2">Password</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
            Sign In
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 hover:text-blue-600 cursor-pointer" onClick={() => navigate("/")}>
          &larr; Back to Home
        </p>
      </div>
    </div>
  );
}
