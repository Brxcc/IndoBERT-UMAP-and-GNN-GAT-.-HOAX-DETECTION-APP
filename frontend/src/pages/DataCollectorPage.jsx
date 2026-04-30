import { useState, useEffect } from "react";
import { UploadCloud, Database, Trash2, FileSpreadsheet, Download } from "lucide-react";
import { Table } from "../components/Table";
import { cn } from "../lib/utils";

const ALLOWED_EXT = [".xlsx", ".xls", ".csv"];

export function DataCollectorPage() {
  const [file, setFile] = useState(null);
  const [datasetName, setDatasetName] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const API_URL = "http://localhost:8000/admin";

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/dataset/history`);
      if (res.ok) setHistory(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setError(`Unsupported format: ${ext}. Please use .xlsx, .xls, or .csv`);
      setFile(null);
      return;
    }
    setError("");
    setFile(f);
    // Pre-fill dataset name with filename (without extension) if empty
    if (!datasetName) {
      setDatasetName(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange({ target: { files: [f] } });
  };

  const handleUpload = async () => {
    if (!file) return;
    if (!datasetName.trim()) {
      setError("Please provide a Dataset Name before uploading.");
      return;
    }
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dataset_name", datasetName.trim());

    try {
      const res = await fetch(`${API_URL}/dataset/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setFile(null);
        setDatasetName("");
        fetchHistory();
      } else {
        const data = await res.json();
        setError(data.detail || "Failed to upload dataset");
      }
    } catch (e) {
      setError("Unable to connect to the backend server");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this dataset?")) return;
    try {
      await fetch(`${API_URL}/dataset/${id}`, { method: "DELETE" });
      fetchHistory();
    } catch (e) {
      alert("Failed to delete dataset");
    }
  };

  const handleDownload = (id) => {
    window.open(`${API_URL}/dataset/${id}/download`, "_blank");
  };

  const getFileIcon = (name = "") => {
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (ext === ".csv") return "📄";
    if ([".xlsx", ".xls"].includes(ext)) return "📊";
    return "📁";
  };

  const columns = [
    { header: "No", cell: (_, rowIndex) => rowIndex + 1 },
    {
      header: "Name",
      cell: (item) => (
        <span className="font-semibold text-slate-800">
          {item.dataset_label || <span className="text-slate-400 italic">—</span>}
        </span>
      )
    },
    {
      header: "Dataset Name",
      cell: (item) => (
        <span className="flex items-center gap-2">
          <span>{getFileIcon(item.name)}</span>
          <span className="text-slate-600 text-sm">{item.name}</span>
        </span>
      )
    },
    {
      header: "Total Data",
      cell: (item) => (
        <span className="font-bold text-slate-700">{item.total_entries.toLocaleString()} rows</span>
      )
    },
    {
      header: "Actions",
      cell: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Database className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Data Collection</h2>
          <p className="text-slate-500 mt-1">
            Upload an Excel (.xlsx) or CSV dataset. The system will automatically count the total rows.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm max-w-2xl">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Upload New Dataset</h3>

        {/* Dataset Name Input */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Dataset Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            placeholder="e.g. Hoax News Dataset 2024"
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <p className="text-xs text-slate-400 mt-1">A friendly name to identify this dataset (different from the filename).</p>
        </div>

        {/* Drop Zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-3xl p-8 text-center transition cursor-pointer",
            file
              ? "border-green-400 bg-green-50/40"
              : "border-blue-200 bg-blue-50/30 hover:bg-blue-50/60"
          )}
          onClick={() => document.getElementById("file-upload").click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          <input
            id="file-upload"
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          {file ? (
            <>
              <FileSpreadsheet className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-800 mb-1">{file.name}</h4>
              <p className="text-sm text-green-600 font-medium">
                {(file.size / 1024).toFixed(1)} KB — Ready to upload
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-slate-800 mb-1">
                Drag &amp; Drop or Click to Select File
              </h4>
              <p className="text-sm text-slate-500">Supports: <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> — Max 100MB</p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className={cn(
              "px-8 py-3 rounded-xl font-bold transition-all shadow-md",
              file && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {loading ? "Uploading..." : "Submit Dataset"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h4 className="font-bold text-slate-700">Upload History</h4>
        </div>
        {history.length === 0
          ? <div className="text-center py-10 text-slate-400 text-sm">No datasets uploaded yet.</div>
          : <Table items={history} columns={columns} />
        }
      </div>
    </div>
  );
}
