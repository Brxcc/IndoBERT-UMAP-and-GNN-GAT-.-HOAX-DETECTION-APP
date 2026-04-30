import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const pageTitles = {
  "/admin/collector": "Data Collection",
  "/admin/preprocessing": "News Preprocessing",
  "/admin/processing": "Model Processing",
  "/admin/testing": "Testing Board",
  "/admin/evaluation": "Evaluation Board",
  "/admin/settings": "Account Settings",
};

export function Layout() {
  const location = useLocation();
  const [title, setTitle] = useState("Hoax Detection System");

  useEffect(() => {
    setTitle(pageTitles[location.pathname] || "Dashboard");
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col h-screen overflow-hidden">
        <Header title={title} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
