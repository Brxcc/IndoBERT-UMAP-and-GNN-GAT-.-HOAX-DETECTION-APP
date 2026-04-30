import { useState, useEffect } from "react";
import { Filter, PlayCircle, Trash2, Database, RefreshCw, CheckCircle, AlertCircle, Download } from "lucide-react";
import { Table } from "../components/Table";
import { cn } from "../lib/utils";

export function PreprocessingPage() {
  const [datasets, setDatasets]         = useState([]);
  const [selectedDataset, setSelectedDataset] = useState("");
  const [loading, setLoading]           = useState(false);
  const [history, setHistory]           = useState([]);
  const [statusMsg, setStatusMsg]       = useState(null);

  const API_URL = "http://localhost:8000/admin";

  const fetchData = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch(`${API_URL}/dataset/history`),
        fetch(`${API_URL}/preprocess/history`),
      ]);
      if (res1.ok) setDatasets(await res1.json());
      if (res2.ok) {
        const data = await res2.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("fetchData error:", e);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProcess = async () => {
    if (!selectedDataset) return;
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch(`${API_URL}/preprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset_id: parseInt(selectedDataset) }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatusMsg({ type: "error", text: data.error || data.detail || `HTTP ${res.status}` });
      } else {
        setStatusMsg({ type: "success", text: data.message || "Preprocessing successful!" });
        setSelectedDataset("");
        await fetchData();
      }
    } catch (e) {
      setStatusMsg({ type: "error", text: `Failed to connect to server: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this preprocessing history?")) return;
    try {
      const res = await fetch(`${API_URL}/preprocess/history/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  const columns = [
    { header: "No.", cell: (_, i) => i + 1 },
    {
      header: "Dataset Name",
      cell: (item) => <span className="font-semibold text-slate-700">{item.dataset_name}</span>,
    },
    {
      header: "Version",
      cell: (item) => (
        <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-md text-sm font-medium">
          {item.version}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (item) => (
        <span className="text-xs text-slate-500">
          {item.timestamp ? new Date(item.timestamp).toLocaleString("en-US") : "-"}
        </span>
      ),
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <a
            href={`http://localhost:8000/admin/preprocess/download/${item.id}`}
            download
            className="p-2 text-slate-400 hover:text-teal-600 bg-slate-50 hover:bg-teal-50 rounded-lg transition"
            title="Download preprocessed dataset"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-2 text-slate-400 hover:text-red-500 bg-slate-50 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
          <Filter className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Preprocessing</h2>
          <p className="text-slate-500 mt-1">
            Clean the dataset (CSV/Excel) before using it in the training pipeline.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Preprocessing Settings</h3>

        <label className="text-sm font-semibold text-slate-700 block mb-2">
          Select Raw Dataset (CSV / Excel)
        </label>
        <select
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition appearance-none mb-6 cursor-pointer"
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
        >
          <option value="">-- Select Dataset --</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.total_entries} rows)
            </option>
          ))}
        </select>

        {statusMsg && (
          <div
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl mb-4 text-sm font-medium",
              statusMsg.type === "success"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            )}
          >
            {statusMsg.type === "success"
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />}
            {statusMsg.text}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleProcess}
            disabled={!selectedDataset || loading}
            className={cn(
              "flex-1 flex justify-center items-center gap-2 py-3 rounded-xl font-bold transition shadow-md text-white",
              selectedDataset && !loading
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-slate-300 cursor-not-allowed"
            )}
          >
            <PlayCircle className="w-5 h-5" />
            {loading ? "Processing Data..." : "Process Dataset"}
          </button>

          <button
            onClick={fetchData}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition flex items-center gap-2"
            title="Refresh history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-700 flex items-center gap-2">
            <Database className="w-4 h-4" /> Preprocessing History ({history.length} entries)
          </h4>
          <button
            onClick={fetchData}
            className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1 transition"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
        <Table
          items={history}
          columns={columns}
          emptyMsg="No preprocessing history yet. Select a dataset and click Process Dataset."
        />
      </div>
    </div>
  );
}
