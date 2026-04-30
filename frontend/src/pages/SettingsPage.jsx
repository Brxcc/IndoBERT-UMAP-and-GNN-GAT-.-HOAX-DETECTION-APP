import { useState } from "react";
import { UserCog, Save, Loader2, KeyRound } from "lucide-react";
import { cn } from "../lib/utils";

export function SettingsPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!username.trim()) return alert("Username cannot be empty");
    
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/auth/admin", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("antihoax_token")}`
        },
        body: JSON.stringify({ 
          username: username, 
          password: password ? password : null 
        })
      });

      if (res.ok) {
        alert("Settings successfully updated. Please use these new credentials on your next login.");
        setPassword("");
      } else {
        const err = await res.json();
        alert(err.detail || "An error occurred while saving settings");
      }
    } catch (err) {
      alert("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
          <UserCog className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Admin Settings</h2>
          <p className="text-slate-500 mt-1">Manage your authentication account details.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
          <KeyRound className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-bold text-slate-800">Login Credentials</h3>
        </div>

        <form onSubmit={handleUpdate} className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">New Username</label>
            <input 
              type="text" 
              placeholder="Enter new Username..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">New Password (Optional)</label>
            <input 
              type="password" 
              placeholder="Leave empty if you don't want to change password"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="mt-8 flex justify-end pt-4 border-t border-slate-100">
            <button 
              type="submit"
              disabled={loading || !username.trim()}
              className={cn(
                "px-8 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2",
                !loading && username.trim() ? "bg-rose-600 text-white hover:bg-rose-700" : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
