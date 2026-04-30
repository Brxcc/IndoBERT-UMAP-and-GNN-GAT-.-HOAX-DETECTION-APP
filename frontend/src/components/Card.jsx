import { cn } from "../lib/utils";

export function Card({ className, children, title, description, icon: Icon }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden", className)}>
      {(title || description || Icon) && (
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-4">
          {Icon && (
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Icon className="w-6 h-6" />
            </div>
          )}
          <div>
            {title && <h3 className="text-lg font-semibold tracking-tight text-slate-800">{title}</h3>}
            {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
          </div>
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
        <Icon className="w-32 h-32" />
      </div>
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <div className="p-3 bg-slate-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center text-sm relative z-10">
          <span className={cn(
            "font-medium",
            trend.isPositive ? "text-emerald-600" : "text-red-500"
          )}>
            {trend.value}
          </span>
          <span className="text-slate-400 ml-2">{trend.label}</span>
        </div>
      )}
    </div>
  );
}
