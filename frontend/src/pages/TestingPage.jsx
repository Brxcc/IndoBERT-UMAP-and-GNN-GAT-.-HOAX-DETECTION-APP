import { useState, useEffect, useRef } from "react";
import {
  FlaskConical, Send, Loader2, CheckCircle2, XCircle, Info, X,
  ChevronDown, Upload, FileText, Download, Trash2, BarChart2, ArrowRight, Eye
} from "lucide-react";
import { cn } from "../lib/utils";

const API = "http://localhost:8000/admin";

// ─── Info Modal ───────────────────────────────────────────────────────────────
function HowModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-bold text-slate-800">How Testing Works</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
        </div>
        <ul className="text-slate-600 text-sm space-y-2 list-disc list-inside leading-relaxed">
          <li><strong>Text Mode</strong>: type or paste raw news text, then click Predict.</li>
          <li><strong>File Mode</strong>: upload a CSV/Excel file containing unlabeled news text. The system automatically detects the text column.</li>
          <li>Confidence Score is derived from the <strong>Softmax</strong> layer in the GAT output.</li>
          <li>Results can be exported to a CSV file.</li>
          <li>Testing history is saved at the bottom of the page.</li>
        </ul>
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition">Close</button>
      </div>
    </div>
  );
}

// ─── Probability Bar ──────────────────────────────────────────────────────────
function ProbBar({ label, value, barColor }) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-semibold text-slate-700">{label}</span>
        <span className={cn("text-sm font-bold", barColor.replace("bg-", "text-"))}>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", barColor)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Download CSV ─────────────────────────────────────────────────────────────
function downloadCSV(predictions, modelName) {
  const rows = [["No", "Text", "Predicted Label", "Confidence (%)"]];
  predictions.forEach((p, i) => {
    rows.push([i+1, `"${p.text?.replace(/"/g, '""')}"`, p.predicted_label, p.confidence]);
  });
  const csv = rows.map(r => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `testing_${modelName}_${Date.now()}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

// ─── History Detail Modal ─────────────────────────────────────────────────────
function HistoryDetailModal({ histId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/testing/history/${histId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [histId]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <Loader2 className="w-8 h-8 text-white animate-spin"/>
    </div>
  );

  if (!data || !data.result_json) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white p-6 rounded-2xl">
        <p className="text-slate-500 mb-4">Detail not found or empty.</p>
        <button onClick={onClose} className="px-4 py-2 bg-slate-100 rounded-lg">Close</button>
      </div>
    </div>
  );

  const preds = data.result_json;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={e=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">History Detail</h3>
            <p className="text-xs text-slate-500">{data.filename || "Text Input"} · {data.model_name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400"/></button>
        </div>
        
        {data.accuracy != null && (
          <div className="px-6 py-3 bg-indigo-50 border-b border-indigo-100 flex gap-4">
            <span className="text-sm font-bold text-indigo-700">Accuracy: {(data.accuracy*100).toFixed(1)}%</span>
            <span className="text-sm font-bold text-indigo-700">F1-Score: {(data.f1_score*100).toFixed(1)}%</span>
          </div>
        )}

        <div className="overflow-y-auto flex-1 p-6">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                {["No", "Text", "Prediction", "Confidence"].map(h => (
                  <th key={h} className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {preds.map((p, i) => {
                const isH = p.predicted_label==="Hoaks" || p.predicted_label==="Hoax";
                return (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-2 text-xs text-slate-400 font-mono">{i+1}</td>
                    <td className="px-4 py-2 text-sm text-slate-700 max-w-sm truncate">{p.text}</td>
                    <td className="px-4 py-2">
                      <span className={cn("px-2 py-1 rounded-lg text-xs font-bold", isH ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                        {isH ? "Hoax" : "Non-Hoax"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs font-bold text-slate-600">{p.confidence.toFixed(1)}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-2xl">
          <button onClick={() => downloadCSV(preds, data.model_name)} className="mr-3 flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition">
            <Download className="w-4 h-4"/> Export CSV
          </button>
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-xl text-sm font-semibold transition">Close</button>
        </div>
      </div>
    </div>
  );
}

export function TestingPage() {
  const [mode,    setMode]    = useState("text"); // "text" | "file"
  const [text,    setText]    = useState("");
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);   // single text result
  const [bulkRes, setBulkRes] = useState(null);   // bulk file result
  const [error,   setError]   = useState("");
  const [showInfo,setShowInfo]= useState(false);
  const [models,  setModels]  = useState([]);
  const [selModel,setSelModel]= useState("");
  const [history, setHistory] = useState([]);
  const [viewDetail, setViewDetail] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    fetch(`${API}/training/results`).then(r=>r.json())
      .then(d => setModels(Array.isArray(d) ? d.filter(m => m.best_model_path) : [])).catch(()=>{});
    loadHistory();
  }, []);

  const loadHistory = () => {
    fetch(`${API}/testing/history`).then(r=>r.json()).then(d=>setHistory(Array.isArray(d)?d:[])).catch(()=>{});
  };

  // ── Single text prediction ──────────────────────────────────────────────────
  const predictText = async () => {
    if (!text.trim()) return;
    setLoading(true); setError(""); setResult(null);
    try {
      const body = { text: text.trim() };
      if (selModel) body.model_id = parseInt(selModel);
      const res  = await fetch(`${API}/predict-text`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) setError(data.detail || "Prediction failed");
      else { setResult(data); loadHistory(); }
    } catch (e) { setError(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  // ── Bulk file prediction ────────────────────────────────────────────────────
  const predictFile = async () => {
    if (!file) return alert("Please select a file first!");
    setLoading(true); setError(""); setBulkRes(null);
    const form = new FormData();
    form.append("file", file);
    const url  = selModel ? `${API}/predict-bulk?model_id=${selModel}` : `${API}/predict-bulk`;
    try {
      const res  = await fetch(url, { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) setError(data.detail || "Prediction failed");
      else { setBulkRes(data); loadHistory(); }
    } catch (e) { setError(`Failed: ${e.message}`); }
    finally { setLoading(false); }
  };

  const deleteHistory = async (id) => {
    if (!confirm("Delete this history?")) return;
    await fetch(`${API}/testing/history/${id}`, { method: "DELETE" });
    loadHistory();
  };

  const isHoaks = result?.predicted_label === "Hoaks" || result?.predicted_label === "Hoax";

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-teal-100 text-teal-600 rounded-xl"><FlaskConical className="w-8 h-8"/></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Testing</h2>
            <p className="text-slate-500 mt-1">Test news text or CSV/Excel files using trained models.</p>
          </div>
        </div>
        <button onClick={()=>setShowInfo(true)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 border border-slate-200 rounded-xl px-3 py-2 transition">
          <Info className="w-4 h-4"/> How it Works
        </button>
      </div>

      {/* Model Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
          Select Model (default: latest model)
        </label>
        {models.length === 0 && (
          <p className="text-xs text-amber-600 mb-2">⚠️ No models saved yet. Train a new model on the Processing page first.</p>
        )}
        <div className="relative">
          <select className="w-full p-3 pr-10 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-slate-50 appearance-none"
            value={selModel} onChange={e=>setSelModel(e.target.value)}>
            <option value="">— Use the latest model automatically —</option>
            {models.map(m => (
              <option key={m.id} value={m.id}>
                {m.model_name} (Acc: {m.accuracy!=null?`${(m.accuracy*100).toFixed(1)}%`:"—"} · F1: {m.f1_score!=null?`${(m.f1_score*100).toFixed(1)}%`:"—"}) · {m.algorithm_mode}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none"/>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 bg-slate-50">
          {[
            { id: "text", label: "Text Input",  icon: FileText },
            { id: "file", label: "Upload File", icon: Upload   },
          ].map(tab => (
            <button key={tab.id} onClick={()=>{ setMode(tab.id); setError(""); setResult(null); setBulkRes(null); }}
              className={cn("flex items-center gap-2 px-6 py-3 text-sm font-semibold transition",
                mode===tab.id ? "text-teal-700 border-b-2 border-teal-500 bg-white" : "text-slate-500 hover:text-slate-700")}>
              <tab.icon className="w-4 h-4"/>{tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* ── Text Mode ── */}
          {mode === "text" && (
            <>
              <label className="text-sm font-bold text-slate-700">News Text (unlabeled)</label>
              <textarea
                className="w-full h-40 p-4 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none bg-slate-50 leading-relaxed"
                placeholder="Paste or type the news text to test if it's Hoax or Non-Hoax..."
                value={text} onChange={e=>setText(e.target.value)}
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{text.length} characters</span>
                <button onClick={predictText} disabled={!text.trim()||loading}
                  className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition shadow-md",
                    text.trim()&&!loading ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300 cursor-not-allowed")}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <Send className="w-5 h-5"/>}
                  {loading ? "Processing..." : "Predict"}
                </button>
              </div>
            </>
          )}

          {/* ── File Mode ── */}
          {mode === "file" && (
            <>
              <div
                onClick={()=>fileRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition">
                <Upload className="w-10 h-10 text-slate-300 mx-auto mb-3"/>
                <p className="text-sm text-slate-600 font-semibold">Click to select file</p>
                <p className="text-xs text-slate-400 mt-1">Format: CSV or Excel (.xlsx .xls)</p>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e=>setFile(e.target.files[0])}/>
              </div>
              {file && (
                <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                  <FileText className="w-5 h-5 text-teal-600 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size/1024).toFixed(1)} KB</p>
                  </div>
                  <button onClick={()=>setFile(null)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                </div>
              )}
              <div className="flex justify-end">
                <button onClick={predictFile} disabled={!file||loading}
                  className={cn("flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white transition shadow-md",
                    file&&!loading ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-300 cursor-not-allowed")}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : <ArrowRight className="w-5 h-5"/>}
                  {loading ? "Processing..." : "Start Testing"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5"/>
          <div><p className="font-semibold text-red-700 text-sm">Prediction Failed</p><p className="text-red-600 text-sm mt-0.5">{error}</p></div>
        </div>
      )}

      {/* Single text result */}
      {result && mode === "text" && (
        <div className={cn("rounded-2xl border-2 shadow-sm p-6 space-y-5 animate-in fade-in",
          isHoaks ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300")}>
          <div className="flex items-center gap-4">
            <div className={cn("p-3 rounded-xl", isHoaks ? "bg-red-100":"bg-green-100")}>
              {isHoaks ? <XCircle className="w-8 h-8 text-red-600"/> : <CheckCircle2 className="w-8 h-8 text-green-600"/>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Prediction Result</p>
              <h3 className={cn("text-3xl font-black", isHoaks ? "text-red-700":"text-green-700")}>{result.predicted_label === "Hoaks" ? "Hoax" : "Non-Hoax"}</h3>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Class Probability Distribution (Softmax)</p>
            {result.probabilities.map((p, i) => (
              <ProbBar key={i} label={["Non-Hoax","Hoax"][i]||`Class ${i}`} value={p} barColor={["bg-green-500","bg-red-500"][i]||"bg-blue-500"} />
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white rounded-xl px-4 py-3 border border-slate-100">
            <FlaskConical className="w-4 h-4 text-teal-500"/>
            <span>Model: <strong className="text-slate-700">{result.model_name}</strong></span>
            <span className="text-slate-300">|</span>
            <span>Accuracy: <strong className="text-slate-700">{(result.model_accuracy*100).toFixed(1)}%</strong></span>
          </div>
        </div>
      )}

      {/* Bulk file result */}
      {bulkRes && mode === "file" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm animate-in fade-in">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Prediction Results ({bulkRes.total} items)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Model: {bulkRes.model_name} · Accuracy: {(bulkRes.model_accuracy*100).toFixed(1)}%</p>
            </div>
            <button onClick={()=>downloadCSV(bulkRes.predictions, bulkRes.model_name)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold transition">
              <Download className="w-4 h-4"/> Export CSV
            </button>
          </div>

          {/* Summary badges */}
          <div className="px-6 py-3 flex gap-3 border-b border-slate-100">
            {[
              { label: "Hoax",     count: bulkRes.predictions.filter(p=>p.predicted_label==="Hoaks" || p.predicted_label==="Hoax").length,  cls: "bg-red-100 text-red-700" },
              { label: "Non-Hoax", count: bulkRes.predictions.filter(p=>p.predicted_label!=="Hoaks" && p.predicted_label!=="Hoax").length, cls: "bg-green-100 text-green-700" },
            ].map(b => (
              <span key={b.label} className={cn("px-3 py-1 rounded-lg text-sm font-bold", b.cls)}>
                {b.label}: {b.count}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  {["No", "News Text", "Predicted Label", "Confidence"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bulkRes.predictions.map((p, i) => {
                  const isH = p.predicted_label==="Hoaks" || p.predicted_label==="Hoax";
                  return (
                    <tr key={i} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i+1}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 max-w-xs truncate" title={p.text}>{p.text}</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2 py-1 rounded-lg text-xs font-bold",
                          isH ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
                          {isH ? "Hoax" : "Non-Hoax"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-24">
                            <div className={cn("h-full rounded-full", isH ? "bg-red-400" : "bg-green-400")}
                              style={{ width: `${p.confidence}%` }}/>
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-12">{p.confidence.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Testing History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between rounded-t-2xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <BarChart2 className="w-4 h-4"/> Testing History ({history.length})
          </h3>
          <button onClick={loadHistory} className="text-xs text-slate-500 hover:text-slate-700 transition">Refresh</button>
        </div>
        {history.length === 0
          ? <div className="text-center py-10 text-slate-400 text-sm">No testing history yet.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>{["#","Type","File Name","Model Used","Sample Count","Date",""].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {history.map((h, i) => (
                    <tr key={h.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i+1}</td>
                      <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded text-xs font-semibold", h.input_type==="file"?"bg-blue-100 text-blue-700":"bg-teal-100 text-teal-700")}>{h.input_type==="file"?"File":"Text"}</span></td>
                      <td className="px-4 py-3 text-slate-600 max-w-36 truncate">{h.filename || "—"}</td>
                      <td className="px-4 py-3 font-semibold text-slate-700">{h.model_name}</td>
                      <td className="px-4 py-3 text-slate-600">{h.total_rows}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{h.timestamp ? new Date(h.timestamp).toLocaleString("en-US") : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={()=>setViewDetail(h.id)} title="View Result" className="p-1.5 text-slate-300 hover:text-blue-500 transition"><Eye className="w-3.5 h-3.5"/></button>
                          <button onClick={()=>deleteHistory(h.id)} title="Delete" className="p-1.5 text-slate-300 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5"/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {showInfo && <HowModal onClose={()=>setShowInfo(false)}/>}
      {viewDetail && <HistoryDetailModal histId={viewDetail} onClose={()=>setViewDetail(null)}/>}
    </div>
  );
}
