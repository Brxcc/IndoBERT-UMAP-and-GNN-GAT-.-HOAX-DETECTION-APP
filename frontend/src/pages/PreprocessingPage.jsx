import { useState, useEffect } from "react";
import {
  Filter, PlayCircle, Trash2, Database, RefreshCw,
  CheckCircle, AlertCircle, Download, ChevronDown, ChevronUp,
  Languages, BookX, BarChart2, Zap
} from "lucide-react";
import { Table } from "../components/Table";
import { cn } from "../lib/utils";

export function PreprocessingPage() {
  const [datasets, setDatasets]         = useState([]);
  const [selectedDataset, setSelected]  = useState("");
  const [loading, setLoading]           = useState(false);
  const [history, setHistory]           = useState([]);
  const [statusMsg, setStatusMsg]       = useState(null);
  const [convertSlang, setConvertSlang] = useState(false);
  const [removeStop, setRemoveStop]     = useState(false);
  const [stats, setStats]               = useState(null);
  const [showSlangTable, setShowSlangTable]     = useState(false);
  const [showStopTable, setShowStopTable]       = useState(false);

  const API_URL = "http://localhost:8000/admin";

  const fetchData = async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/dataset/history`),
        fetch(`${API_URL}/preprocess/history`),
      ]);
      if (r1.ok) setDatasets(await r1.json());
      if (r2.ok) {
        const d = await r2.json();
        setHistory(Array.isArray(d) ? d : []);
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleProcess = async () => {
    if (!selectedDataset) return;
    setLoading(true);
    setStatusMsg(null);
    setStats(null);
    try {
      const res = await fetch(`${API_URL}/preprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset_id:      parseInt(selectedDataset),
          convert_slang:   convertSlang,
          remove_stopwords: removeStop,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatusMsg({ type: "error", text: data.error || data.detail || `HTTP ${res.status}` });
      } else {
        setStatusMsg({ type: "success", text: data.message || "Preprocessing complete!" });
        if (data.stats) setStats(data.stats);
        setSelected("");
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
            Clean and normalize your dataset before using it in the training pipeline.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Preprocessing Settings</h3>

        {/* Dataset Selector */}
        <label className="text-sm font-semibold text-slate-700 block mb-2">
          Select Raw Dataset (CSV / Excel)
        </label>
        <select
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition appearance-none mb-6 cursor-pointer"
          value={selectedDataset}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="">-- Select Dataset --</option>
          {datasets.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.total_entries} rows)
            </option>
          ))}
        </select>

        {/* NLP Options */}
        <div className="mb-6 space-y-3">
          <p className="text-sm font-semibold text-slate-700 mb-3">NLP Options</p>

          {/* Slang Conversion Toggle */}
          <button
            type="button"
            onClick={() => setConvertSlang(v => !v)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all text-left",
              convertSlang
                ? "border-purple-400 bg-purple-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all",
                convertSlang ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"
              )}>
                <Languages className="w-4 h-4" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", convertSlang ? "text-purple-800" : "text-slate-700")}>
                  Slang Word Conversion
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Convert informal words to standard Indonesian (200+ entries). e.g. "gak" → "tidak"
                </p>
              </div>
            </div>
            {/* Toggle Switch */}
            <div className={cn(
              "relative w-11 h-6 rounded-full transition-all flex-shrink-0",
              convertSlang ? "bg-purple-500" : "bg-slate-300"
            )}>
              <span className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                convertSlang ? "left-6" : "left-1"
              )} />
            </div>
          </button>

          {/* Stopword Removal Toggle */}
          <button
            type="button"
            onClick={() => setRemoveStop(v => !v)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all text-left",
              removeStop
                ? "border-indigo-400 bg-indigo-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300"
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2 rounded-lg transition-all",
                removeStop ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
              )}>
                <BookX className="w-4 h-4" />
              </div>
              <div>
                <p className={cn("text-sm font-bold", removeStop ? "text-indigo-800" : "text-slate-700")}>
                  Stopword Removal
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Remove non-informative words (300+ entries). e.g. "dan", "yang", "di"
                </p>
              </div>
            </div>
            {/* Toggle Switch */}
            <div className={cn(
              "relative w-11 h-6 rounded-full transition-all flex-shrink-0",
              removeStop ? "bg-indigo-500" : "bg-slate-300"
            )}>
              <span className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                removeStop ? "left-6" : "left-1"
              )} />
            </div>
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={cn(
            "flex items-center gap-3 p-4 rounded-xl mb-4 text-sm font-medium",
            statusMsg.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          )}>
            {statusMsg.type === "success"
              ? <CheckCircle className="w-5 h-5 shrink-0" />
              : <AlertCircle className="w-5 h-5 shrink-0" />}
            {statusMsg.text}
          </div>
        )}

        {/* Action Buttons */}
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
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Processing...</>
              : <><PlayCircle className="w-5 h-5" />Process Dataset</>
            }
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

      {/* Stats Summary Card */}
      {stats && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-slate-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-purple-600" />
            <h4 className="font-bold text-slate-800">Preprocessing Summary</h4>
            <span className="ml-auto flex items-center gap-1 text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> Complete
            </span>
          </div>

          {/* Token Reduction */}
          <div className="p-6 grid grid-cols-3 gap-4 border-b border-slate-100">
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Before</p>
              <p className="text-2xl font-black text-slate-700">{stats.tokens_before?.toLocaleString()}</p>
              <p className="text-xs text-slate-400">tokens</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">After</p>
              <p className="text-2xl font-black text-slate-700">{stats.tokens_after?.toLocaleString()}</p>
              <p className="text-xs text-slate-400">tokens</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Reduction</p>
              <p className="text-2xl font-black text-purple-600">{stats.reduction_pct}%</p>
              <p className="text-xs text-slate-400">token removed</p>
            </div>
          </div>

          {/* Token bar */}
          <div className="px-6 py-3 border-b border-slate-100">
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, 100 - (stats.reduction_pct ?? 0))}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-right">{100 - (stats.reduction_pct ?? 0)}% retained</p>
          </div>

          {/* Slang & Stopword Stats */}
          <div className="grid grid-cols-2 divide-x divide-slate-100">

            {/* Slang */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-purple-500" />
                <p className="text-sm font-bold text-slate-700">Slang Converted</p>
              </div>
              {convertSlang && stats.slang_total > 0 ? (
                <>
                  <p className="text-xl font-black text-purple-600">{stats.slang_total}</p>
                  <p className="text-xs text-slate-400">{stats.slang_unique} unique words</p>
                  {stats.slang_list?.length > 0 && (
                    <button
                      onClick={() => setShowSlangTable(v => !v)}
                      className="mt-2 text-xs text-purple-600 flex items-center gap-1 hover:underline"
                    >
                      {showSlangTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showSlangTable ? "Hide" : "Show"} top words
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">{convertSlang ? "No slang found" : "Not enabled"}</p>
              )}
            </div>

            {/* Stopword */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookX className="w-4 h-4 text-indigo-500" />
                <p className="text-sm font-bold text-slate-700">Stopwords Removed</p>
              </div>
              {removeStop && stats.stopword_total > 0 ? (
                <>
                  <p className="text-xl font-black text-indigo-600">{stats.stopword_total}</p>
                  <p className="text-xs text-slate-400">{stats.stopword_unique} unique words</p>
                  {stats.stopword_list?.length > 0 && (
                    <button
                      onClick={() => setShowStopTable(v => !v)}
                      className="mt-2 text-xs text-indigo-600 flex items-center gap-1 hover:underline"
                    >
                      {showStopTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {showStopTable ? "Hide" : "Show"} top words
                    </button>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">{removeStop ? "No stopwords found" : "Not enabled"}</p>
              )}
            </div>
          </div>

          {/* Slang Table */}
          {showSlangTable && stats.slang_list?.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Top Slang Conversions</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left pb-1">Original</th>
                    <th className="text-left pb-1">Replacement</th>
                    <th className="text-right pb-1">Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.slang_list.slice(0, 20).map((s, i) => (
                    <tr key={i}>
                      <td className="py-1 text-red-600 font-mono">{s.original}</td>
                      <td className="py-1 text-green-700 font-mono">{s.replacement}</td>
                      <td className="py-1 text-right text-slate-500 font-bold">{s.count}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Stopword Table */}
          {showStopTable && stats.stopword_list?.length > 0 && (
            <div className="border-t border-slate-100 px-4 py-3 max-h-48 overflow-y-auto">
              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Top Removed Stopwords</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400">
                    <th className="text-left pb-1">Word</th>
                    <th className="text-right pb-1">Removed Count</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {stats.stopword_list.slice(0, 20).map((s, i) => (
                    <tr key={i}>
                      <td className="py-1 font-mono text-slate-600">{s.word}</td>
                      <td className="py-1 text-right font-bold text-indigo-600">{s.count}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
