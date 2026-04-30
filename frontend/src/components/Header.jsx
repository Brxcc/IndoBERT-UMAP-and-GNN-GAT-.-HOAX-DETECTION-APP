import { UserCircle, LogOut } from "lucide-react";

export function Header({ title }) {
  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>
      
      <div className="flex items-center gap-6">
        <button 
          onClick={() => {
            localStorage.removeItem("antihoax_token");
            window.location.href = "/admin/login";
          }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
        
        <div className="h-8 w-px bg-slate-200"></div>
        
        <div className="flex items-center gap-3 group">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">Admin</p>
            <p className="text-xs text-slate-500">System Administrator</p>
          </div>
          <UserCircle className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors" />
        </div>
      </div>
    </header>
  );
}
