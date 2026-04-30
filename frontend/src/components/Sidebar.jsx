import { NavLink } from "react-router-dom"
import { Database, Activity, FileSpreadsheet, Settings, FlaskConical, Cpu } from "lucide-react"

const navItems = [
  { name: "Data Collection",  path: "/admin/collector",     icon: Database },
  { name: "Preprocessing",    path: "/admin/preprocessing",  icon: FileSpreadsheet },
  { name: "Processing",       path: "/admin/processing",     icon: Cpu },
  { name: "Testing",          path: "/admin/testing",        icon: FlaskConical },
  { name: "Evaluation Board", path: "/admin/evaluation",     icon: Activity },
  { name: "Admin Settings",   path: "/admin/settings",       icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 h-screen fixed top-0 left-0 text-white flex flex-col shadow-xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          AntiHOAX
        </h1>
        <p className="text-xs text-slate-400 mt-1">Hoax Detection System</p>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          &copy; 2026 Detection System
        </div>
      </div>
    </aside>
  );
}
