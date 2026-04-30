import { useState, useEffect } from "react";
import {
  Activity, Database, Info, X, Target, RefreshCcw,
  Trash2, ChevronDown, ChevronUp, Download, Eye, CheckCircle2, Loader2, Pencil, Check
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar as RadarShape,
} from "recharts";
import { cn } from "../lib/utils";

const API = "http://localhost:8000/admin";

// ─── Metric Definitions (English) ─────────────────────────────────────────────
const METRIC_DEFS = {
  accuracy: {
    title:    "Accuracy",
    def:      "The percentage of correct predictions out of all test samples.",
    formula:  "Accuracy = (TP + TN) / (TP + TN + FP + FN)",
    interp:   "High values (>90%) mean the model is almost always correct. Can be misleading for imbalanced datasets.",
    critical: "Most meaningful when class distribution is balanced.",
  },
  precision: {
    title:    "Precision",
    def:      "Of all articles predicted as Hoax, what percentage are actually Hoax.",
    formula:  "Precision = TP / (TP + FP)",
    interp:   "High precision means the model rarely labels genuine news as Hoax (few False Positives).",
    critical: "Critical when the cost of False Positives is high (e.g., wrongly flagging credible media).",
  },
  recall: {
    title:    "Recall (Sensitivity)",
    def:      "Of all articles that are truly Hoax, what percentage did the model successfully detect.",
    formula:  "Recall = TP / (TP + FN)",
    interp:   "High recall means the model rarely misses real Hoax articles.",
    critical: "Critical when False Negatives are dangerous — letting hoaxes pass undetected.",
  },
  f1: {
    title:    "F1-Score",
    def:      "The harmonic mean of Precision and Recall.",
    formula:  "F1 = 2 × (Precision × Recall) / (Precision + Recall)",
    interp:   "F1 reflects the balance between Precision and Recall. Best metric for imbalanced datasets.",
    critical: "Primary metric when the dataset is imbalanced — use this as the main performance benchmark.",
  },
  loss: {
    title:    "Training Loss",
    def:      "The value of the loss function (NLL Loss) on training or validation data per epoch.",
    formula:  "NLL Loss = -Σ log P(y_true | x)",
    interp:   "Decreasing loss = model is learning. If val loss rises while train loss drops = overfitting.",
    critical: "Monitor loss per epoch to detect overfitting early.",
  },
  mcc: {
    title:    "MCC (Matthews Correlation Coefficient)",
    def:      "The correlation coefficient between predictions and actual labels. Most balanced metric for binary classification.",
    formula:  "MCC = (TP×TN − FP×FN) / √((TP+FP)(TP+FN)(TN+FP)(TN+FN))",
    interp:   "+1 = perfect, 0 = random, -1 = completely inverted.",
    critical: "Most reliable metric for highly imbalanced datasets — better than F1 in extreme cases.",
  },
  macro_avg: {
    title:    "Macro Average",
    def:      "The unweighted mean of the metric across all classes.",
    formula:  "Macro Avg = (Metric_Class0 + Metric_Class1) / 2",
    interp:   "Treats all classes equally regardless of their support (number of samples).",
    critical: "Useful to see if the model performs well on minority classes.",
  },
  weighted_avg: {
    title:    "Weighted Average",
    def:      "The mean of the metric across all classes, weighted by the number of true instances in each class.",
    formula:  "Weighted Avg = Σ(Metric_Class × Support_Class) / Total_Support",
    interp:   "Accounts for class imbalance by giving more weight to the majority class.",
    critical: "Provides a realistic overall performance score when classes are imbalanced.",
  },
  roc_auc: {
    title:    "ROC-AUC",
    def:      "Area Under the Receiver Operating Characteristic Curve. Measures the ability to distinguish between classes.",
    formula:  "AUC = Integral of True Positive Rate w.r.t False Positive Rate",
    interp:   "1.0 means perfect separation, 0.5 means random guessing.",
    critical: "Excellent for evaluating probability thresholds and overall classification capability.",
  },
  mean_std: {
    title:    "Mean Standard Deviation",
    def:      "The standard deviation of cross-validation metrics across folds.",
    formula:  "Mean Std = √[ Σ(x_i - μ)² / N ]",
    interp:   "A lower standard deviation indicates the model is more stable and consistent across different data splits.",
    critical: "Crucial for assessing model robustness and generalization.",
  },
};

// ─── Info Modal ────────────────────────────────────────────────────────────────
function MetricModal({ metricKey, onClose }) {
  const d = METRIC_DEFS[metricKey];
  if (!d) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 border border-slate-100" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg"><Info className="w-4 h-4 text-blue-600"/></div>
            <h3 className="font-bold text-slate-800">{d.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
        </div>
        <div className="space-y-3">
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Definition</p><p className="text-sm text-slate-700">{d.def}</p></div>
          <div className="bg-slate-50 rounded-lg px-4 py-3">
            <p className="text-xs font-bold text-slate-500 mb-1">Formula</p>
            <code className="text-xs text-indigo-700 font-mono">{d.formula}</code>
          </div>
          <div><p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Interpretation</p><p className="text-sm text-slate-700">{d.interp}</p></div>
          <div className="bg-amber-50 rounded-lg px-4 py-3">
            <p className="text-xs font-bold text-amber-700 mb-0.5">When is this metric critical?</p>
            <p className="text-xs text-amber-600">{d.critical}</p>
          </div>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Close</button>
      </div>
    </div>
  );
}

function InfoBtn({ metricKey }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={()=>setOpen(true)} className="text-slate-300 hover:text-blue-500 transition ml-1 shrink-0">
        <Info className="w-3.5 h-3.5"/>
      </button>
      {open && <MetricModal metricKey={metricKey} onClose={()=>setOpen(false)}/>}
    </>
  );
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
const ChartTip = ({active,payload,label}) => {
  if (!active||!payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map(p=><p key={p.name} style={{color:p.color}} className="font-semibold">{p.name}: {typeof p.value==="number"?p.value.toFixed(2):p.value}</p>)}
    </div>
  );
};

// ─── Training Model History Table Row ────────────────────────────────────────
function TrainingRow({ result, index, onDelete, onViewDetail, onLoad, isBest, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(result.model_name || "");
  const [isSaving, setIsSaving] = useState(false);
  const settings = result.settings ? (typeof result.settings === "string" ? JSON.parse(result.settings) : result.settings) : {};
  const epochLogs = result.epoch_logs || [];
  const c = v => v>=0.8?"text-green-600":v>=0.6?"text-amber-500":"text-red-500";

  const handleSaveRename = async () => {
    if (!editName.trim() || editName === result.model_name) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`${API}/training/results/${result.id}/rename`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_name: editName })
      });
      if (res.ok) {
        if (onRefresh) onRefresh();
        setIsEditing(false);
      } else {
        alert("Failed to rename model");
      }
    } catch (e) {
      alert("Error renaming model");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <tr className="hover:bg-slate-50 transition">
        <td className="px-4 py-3 text-xs text-slate-400 font-mono">{index+1}</td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input autoFocus value={editName} onChange={e=>setEditName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSaveRename()}
                  className="px-2 py-1 text-sm border border-blue-400 rounded outline-none w-40" disabled={isSaving}/>
                <button onClick={handleSaveRename} disabled={isSaving} className="p-1 text-green-600 hover:bg-green-100 rounded">
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Check className="w-3.5 h-3.5"/>}
                </button>
                <button onClick={()=>{setIsEditing(false); setEditName(result.model_name||"");}} disabled={isSaving} className="p-1 text-slate-400 hover:bg-slate-200 rounded">
                  <X className="w-3.5 h-3.5"/>
                </button>
              </div>
            ) : (
              <>
                <p className="font-semibold text-slate-800 text-sm">{result.model_name||"—"}</p>
                <button onClick={()=>setIsEditing(true)} className="text-slate-300 hover:text-blue-500 transition"><Pencil className="w-3.5 h-3.5"/></button>
                {isBest && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold">🏆 Best</span>}
              </>
            )}
          </div>
        </td>
        <td className="px-3 py-3 text-xs text-slate-500">{result.algorithm_mode||"hybrid"}</td>
        <td className="px-3 py-3 text-xs text-slate-500 max-w-[120px] truncate">
          {result.dataset_name || `Dataset #${result.dataset_id||"—"}`}
        </td>
        <td className="px-3 py-3 text-xs text-slate-500">{result.split_ratio||"—"}</td>
        <td className="px-3 py-3 text-xs text-slate-500">
          {epochLogs.length ? epochLogs.reduce((b,l)=>l.f1>=(b.f1??0)?l:b, epochLogs[0])?.epoch ?? "—" : "—"}
        </td>
        <td className="px-3 py-3"><span className={cn("font-bold text-sm", c(result.accuracy??0))}>{result.accuracy!=null?`${(result.accuracy*100).toFixed(1)}%`:"—"}</span></td>
        <td className="px-3 py-3 text-blue-600 font-bold text-sm">{result.f1_score!=null?`${(result.f1_score*100).toFixed(1)}%`:"—"}</td>
        <td className="px-3 py-3 text-xs text-slate-400">{result.timestamp?new Date(result.timestamp).toLocaleDateString("en-US"):""}</td>
        <td className="px-3 py-3">
          <div className="flex items-center gap-1">
            <button onClick={()=>onViewDetail(result)} title="View Detail"
              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Eye className="w-3.5 h-3.5"/></button>
            <button onClick={()=>onLoad(result)} title="Load Parameters"
              className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"><CheckCircle2 className="w-3.5 h-3.5"/></button>
            <a href={`${API}/export/excel/${result.id}`} download title="Download Excel"
              className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"><Download className="w-3.5 h-3.5"/></a>
            <button onClick={()=>onDelete(result.id)} title="Delete"
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5"/></button>
            <button onClick={()=>setExpanded(p=>!p)} className="p-1.5 text-slate-300 hover:text-slate-500 rounded-lg transition">
              {expanded ? <ChevronUp className="w-3.5 h-3.5"/> : <ChevronDown className="w-3.5 h-3.5"/>}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-slate-50">
          <td colSpan={10} className="px-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parameters</p>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {Object.entries(settings).filter(([k])=>!["dataset_id","model_name"].includes(k)).map(([k,v])=>(
                    <div key={k} className="flex justify-between px-3 py-1.5 hover:bg-slate-50">
                      <span className="text-xs text-slate-400 font-mono truncate mr-2">{k}</span>
                      <span className="text-xs font-semibold text-slate-700">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
              {epochLogs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top 5 Epochs (by F1)</p>
                  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden text-xs">
                    <table className="w-full">
                      <thead className="bg-slate-50"><tr>
                        {["Epoch","Loss","Acc","F1","MCC"].map(h=><th key={h} className="px-2 py-1.5 text-left font-bold text-slate-500">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {[...epochLogs].sort((a,b)=>(b.f1??0)-(a.f1??0)).slice(0,5).map((l,i)=>(
                          <tr key={i} className={l.is_best?"bg-yellow-50 font-bold":""}>
                            <td className="px-2 py-1.5 font-mono">{l.epoch}</td>
                            <td className="px-2 py-1.5">{l.loss?.toFixed(3)}</td>
                            <td className="px-2 py-1.5">{((l.akurasi??0)*100).toFixed(1)}%</td>
                            <td className="px-2 py-1.5 text-blue-600">{((l.f1??0)*100).toFixed(1)}%</td>
                            <td className="px-2 py-1.5">{((l.mcc??0)*100).toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Detail View Modal ────────────────────────────────────────────────────────
function DetailModal({ result, onClose }) {
  if (!result) return null;
  const metrics = [
    { k: "accuracy",  l: "Accuracy" }, { k: "precision", l: "Precision" },
    { k: "recall",    l: "Recall"   }, { k: "f1_score",  l: "F1-Score"  },
    { k: "macro_average", l: "Macro Average" }, { k: "weighted_average", l: "Weighted Average" },
    { k: "mcc",       l: "MCC"      }, { k: "roc_auc",   l: "ROC-AUC"   },
    { k: "mean_std",  l: "Mean Std" }
  ];
  const color = v => v>=0.8?"text-green-600":v>=0.6?"text-amber-500":"text-red-500";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">{result.model_name || "Model Detail"}</h2>
            <p className="text-indigo-200 text-xs">{result.timestamp ? new Date(result.timestamp).toLocaleString("en-US") : ""}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-white"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metrics.map(m=>(
              <div key={m.k} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className={cn("text-xl font-black", color(result[m.k]??0))}>{result[m.k]!=null?`${(result[m.k]*100).toFixed(1)}%`:"—"}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.l}</p>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition">Close</button>
        </div>
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

// ─── Advanced 9-Metric Comparison Chart (Train vs Test) ────────────────────────
const NINE_METRICS = [
  {label:"Accuracy",    trainKey:"accuracy",         testKey:"accuracy"},
  {label:"Precision",   trainKey:"precision",        testKey:"precision"},
  {label:"Recall",      trainKey:"recall",           testKey:"recall"},
  {label:"F1-Score",    trainKey:"f1_score",         testKey:"f1_score"},
  {label:"Macro Avg",   trainKey:"macro_average",    testKey:"macro_average"},
  {label:"Weighted Avg",trainKey:"weighted_average", testKey:"weighted_average"},
  {label:"MCC",         trainKey:"mcc",              testKey:"mcc"},
  {label:"ROC-AUC",     trainKey:"roc_auc",          testKey:"roc_auc"},
  {label:"Mean Std",    trainKey:"mean_std",         testKey:"mean_std"},
];

function CustomBarLabel({ x, y, width, value }) {
  if (value == null || value === 0) return null;
  return (
    <text x={x + width / 2} y={y - 4} fill="#374151" textAnchor="middle" fontSize={9} fontWeight="bold">
      {Number(value).toFixed(4)}
    </text>
  );
}

function AdvancedComparisonChart({ compResult, matchTest }) {
  const data = NINE_METRICS.map(m => ({
    name:  m.label,
    Train: compResult?.[m.trainKey] != null ? +compResult[m.trainKey].toFixed(4) : 0,
    Test:  matchTest?.[m.testKey] != null ? +matchTest[m.testKey].toFixed(4) : null,
  }));
  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <h4 className="font-bold text-slate-700 mb-1">Training vs Testing Performance Comparison</h4>
      <p className="text-xs text-slate-400 mb-4">All 9 metrics · Training = Blue · Testing = Green · Values shown on bars</p>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{top:24,right:20,left:0,bottom:5}} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:10}} dy={5}/>
            <YAxis axisLine={false} tickLine={false} tick={{fill:"#64748b",fontSize:10}} domain={[0,1]}
              tickFormatter={v=>v.toFixed(1)}/>
            <Tooltip formatter={(v,n)=>[v!=null?v.toFixed(4):"N/A",n]} contentStyle={{borderRadius:8,fontSize:12}}/>
            <Legend wrapperStyle={{fontSize:"12px",paddingTop:"8px"}}/>
            <Bar dataKey="Train" name="Training" fill="#4A90D9" radius={[4,4,0,0]} barSize={22}
              label={<CustomBarLabel/>}/>
            <Bar dataKey="Test"  name="Testing"  fill="#27AE60" radius={[4,4,0,0]} barSize={22}
              label={<CustomBarLabel/>}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function RadarComparisonChart({ compResult, matchTest }) {
  const data = NINE_METRICS.map(m => ({
    metric: m.label,
    Train:  compResult?.[m.trainKey] != null ? parseFloat(compResult[m.trainKey].toFixed(4)) : 0,
    Test:   matchTest?.[m.testKey] != null ? parseFloat(matchTest[m.testKey].toFixed(4)) : 0,
  }));
  const hasTest = matchTest != null;
  return (
    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
      <h4 className="font-bold text-slate-700 mb-1">Performance Radar Chart</h4>
      <p className="text-xs text-slate-400 mb-4">
        Shape comparison of Training vs Testing across all 9 metrics · {hasTest ? "Both Training & Testing shown" : "Only Training shown — run a labeled test to see Testing polygon"}
      </p>
      <div className="h-[340px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} />
            <PolarRadiusAxis angle={90} domain={[0, 1]} tick={{ fill: "#94a3b8", fontSize: 9 }}
              tickFormatter={v => v.toFixed(1)} tickCount={6} />
            <RadarShape name="Training" dataKey="Train" stroke="#4A90D9" fill="#4A90D9" fillOpacity={0.25}
              strokeWidth={2} dot={{ r: 3, fill: "#4A90D9" }} />
            {hasTest && (
              <RadarShape name="Testing" dataKey="Test" stroke="#27AE60" fill="#27AE60" fillOpacity={0.25}
                strokeWidth={2} dot={{ r: 3, fill: "#27AE60" }} />
            )}
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
            <Tooltip formatter={(v, n) => [v != null ? v.toFixed(4) : "N/A", n]}
              contentStyle={{ borderRadius: 8, fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function GapBadgesRow({ compResult, matchTest }) {
  if (!matchTest) return null;
  return (
    <div className="flex flex-wrap gap-2">
      <p className="text-xs font-bold text-slate-500 w-full uppercase tracking-wider">Overfitting Gap Indicators (Train − Test)</p>
      {NINE_METRICS.map(m => {
        const tr = compResult?.[m.trainKey];
        const te = matchTest?.[m.testKey];
        if (tr == null || te == null) return null;
        const gap = Math.abs(tr - te);
        const over = gap > 0.07;
        return (
          <span key={m.label}
            className={cn("px-2 py-1 rounded-full text-xs font-bold border",
              over ? "bg-red-100 text-red-700 border-red-200" : "bg-green-100 text-green-700 border-green-200")}>
            {m.label}: Δ {(gap*100).toFixed(1)}%{over?" ⚠":""}
          </span>
        );
      })}
    </div>
  );
}

function OverfitWarningPanel({ compResult, matchTest }) {
  if (!matchTest) return null;
  const overfit = NINE_METRICS.filter(m => {
    const tr = compResult?.[m.trainKey], te = matchTest?.[m.testKey];
    return tr!=null && te!=null && Math.abs(tr-te) > 0.07;
  });
  if (!overfit.length) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-green-600 text-lg">✅</span>
      <div><p className="font-bold text-green-800 text-sm">No Overfitting Detected</p>
        <p className="text-green-700 text-xs mt-0.5">All metrics are within the 7% train/test gap threshold.</p></div>
    </div>
  );
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
      <p className="font-bold text-red-800 text-sm">⚠ Overfitting Detected in {overfit.length} metric(s)</p>
      <ul className="text-xs text-red-700 space-y-0.5 list-disc list-inside">
        {overfit.map(m=><li key={m.label}>{m.label}: gap = {(Math.abs((compResult?.[m.trainKey]||0)-(matchTest?.[m.testKey]||0))*100).toFixed(1)}%</li>)}
      </ul>
      <p className="text-xs text-red-600 font-semibold mt-1">Suggestions:</p>
      <ul className="text-xs text-red-600 space-y-0.5 list-disc list-inside">
        <li>Increase <strong>Dropout Rate</strong> to 0.3–0.5</li>
        <li>Reduce <strong>GAT Epochs</strong> and rely on Early Stopping</li>
        <li>Decrease <strong>Early Stopping Patience</strong> (e.g. set to 3)</li>
        <li>Add more training data or use data augmentation</li>
      </ul>
    </div>
  );
}

export function EvaluationPage() {
  const [results,      setResults]     = useState([]);
  const [testHistory,  setTestHistory] = useState([]);
  const [compModel,    setCompModel]   = useState("");
  const [detailModal,  setDetailModal] = useState(null);
  const [loadedParams, setLoadedParams]= useState(null);
  const [viewHistory,  setViewHistory] = useState(null);

  const fetchAll = () => {
    // Training results
    fetch(`${API}/training/results`).then(r=>r.json()).then(async (d) => {
      if (!Array.isArray(d)) return setResults([]);
      const full = await Promise.all(d.map(r =>
        fetch(`${API}/training/results/${r.id}`).then(res=>res.ok?res.json():r).catch(()=>r)
      ));
      setResults(full);
    }).catch(()=>{});

    // Testing history
    fetch(`${API}/testing/history`).then(r=>r.json()).then(d=>setTestHistory(Array.isArray(d)?d:[])).catch(()=>{});
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => {
    if (results.length && !compModel) setCompModel(results[0]?.id?.toString());
  }, [results]);

  const handleDeleteTraining = async (id) => {
    if (!confirm("Delete this training result?")) return;
    await fetch(`${API}/training/results/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const handleDeleteTesting = async (id) => {
    if (!confirm("Delete this testing session?")) return;
    await fetch(`${API}/testing/history/${id}`, { method: "DELETE" });
    fetchAll();
  };

  const exportCSV = (result) => {
    if (!result) return;
    const rows = [
      ["Metric","Value"],
      ["Model Name", result.model_name],
      ["Accuracy",   ((result.accuracy??0)*100).toFixed(2)+"%"],
      ["Precision",  ((result.precision??0)*100).toFixed(2)+"%"],
      ["Recall",     ((result.recall??0)*100).toFixed(2)+"%"],
      ["F1-Score",   ((result.f1_score??0)*100).toFixed(2)+"%"],
      ["Macro Average", ((result.macro_average??0)*100).toFixed(2)+"%"],
      ["Weighted Average", ((result.weighted_average??0)*100).toFixed(2)+"%"],
      ["MCC",        ((result.mcc??0)*100).toFixed(2)+"%"],
      ["ROC-AUC",    ((result.roc_auc??0)*100).toFixed(2)+"%"],
      ["Mean Std",   ((result.mean_std??0)*100).toFixed(2)+"%"],
      ["Algorithm",  result.algorithm_mode||"hybrid"],
    ];
    const csv  = rows.map(r=>r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF"+csv], { type: "text/csv;charset=utf-8;" });
    const a    = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `evaluation_${result.model_name}_${Date.now()}.csv`;
    a.click();
  };

  const bestResult = results.length ? results.reduce((b,r)=>(r.f1_score??0)>(b.f1_score??0)?r:b, results[0]) : null;
  const compResult = compModel ? results.find(r=>r.id?.toString()===compModel) : results[0];

  // Try to find matching test history for the selected model that has metrics
  const matchTest = testHistory.find(t => t.model_id?.toString() === compModel && t.accuracy != null);


  const TRAINING_COLS = [
    { h: "#",           k: null },
    { h: "Model Name",  k: null },
    { h: "Algorithm",   k: null },
    { h: "Dataset",     k: null },
    { h: "Split Ratio", k: null },
    { h: "Best Epoch",  k: null },
    { h: "Accuracy",    k: "accuracy" },
    { h: "F1-Score",    k: "f1" },
    { h: "Date",        k: null },
    { h: "Actions",     k: null },
  ];

  const TESTING_COLS = [
    { h: "#",            k: null },
    { h: "Test Name",    k: null },
    { h: "Model Used",   k: null },
    { h: "Dataset",      k: null },
    { h: "Total Samples",k: null },
    { h: "Date",         k: null },
    { h: "Actions",      k: null },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Activity className="w-8 h-8"/></div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Evaluation Board</h2>
            <p className="text-slate-500 mt-1">Performance metrics — Hybrid IndoBERT + UMAP + GAT.</p>
          </div>
        </div>
        <button onClick={fetchAll} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1 transition">
          <RefreshCcw className="w-3.5 h-3.5"/> Refresh
        </button>
      </div>

      {/* ── Section 1 — Training Model History ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-500"/> Section 1 — Training Model History ({results.length})
          </h3>
          <p className="text-xs text-slate-400">Click row icons to view detail, load parameters, or delete</p>
        </div>
        {results.length === 0
          ? <div className="text-center py-12 text-slate-400 text-sm">No models trained yet. Train a model on the Processing page.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {TRAINING_COLS.map((col, i) => (
                      <th key={i} className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                        <span className="flex items-center">{col.h}{col.k && <InfoBtn metricKey={col.k}/>}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {results.map((r, i) => (
                    <TrainingRow key={r.id} result={r} index={i}
                      isBest={bestResult?.id === r.id}
                      onDelete={handleDeleteTraining}
                      onViewDetail={setDetailModal}
                      onLoad={(result) => { setLoadedParams(result); alert(`Parameters from "${result.model_name}" will be loaded into Processing.`); }}
                      onRefresh={fetchAll}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
      </div>

      {/* ── Section 2 — Testing History ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500"/> Section 2 — Testing History ({testHistory.length})
          </h3>
        </div>
        {testHistory.length === 0
          ? <div className="text-center py-12 text-slate-400 text-sm">No testing sessions found. Run a test on the Testing page.</div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {TESTING_COLS.map((col, i) => (
                      <th key={i} className="px-3 py-3 text-left text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                        {col.h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {testHistory.map((t, i) => (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 font-mono">{i+1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-800 text-sm">{t.filename || `Text Session #${t.id}`}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{t.model_name || "—"}</td>
                      <td className="px-3 py-3 text-xs text-slate-500">{t.input_type === "file" ? t.filename : "Direct Input"}</td>
                      <td className="px-3 py-3 text-xs font-bold text-slate-600">{t.total_rows?.toLocaleString() || 1} samples</td>
                      <td className="px-3 py-3 text-xs text-slate-400">{t.timestamp ? new Date(t.timestamp).toLocaleDateString("en-US") : ""}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={()=>setViewHistory(t.id)} title="View Result" className="p-1.5 text-slate-300 hover:text-blue-500 transition"><Eye className="w-3.5 h-3.5"/></button>
                          <button onClick={() => handleDeleteTesting(t.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
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

      {/* ── Section 3 — Model Comparison ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500"/> Section 3 — Model Comparison (Training vs Testing)
          </h3>
        </div>
        <div className="p-6 space-y-6">
          {/* Model Selector */}
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-600">Select Model:</label>
            <select className="p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={compModel} onChange={e => setCompModel(e.target.value)}>
              {results.map(r => <option key={r.id} value={r.id}>{r.model_name||"—"}</option>)}
            </select>
            {compResult && (
              <button onClick={() => exportCSV(compResult)}
                className="flex items-center gap-1.5 text-xs px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
                <Download className="w-3.5 h-3.5"/> Export CSV
              </button>
            )}
            {compResult && (
              <a href={`${API}/export/excel/${compResult.id}`} download
                className="flex items-center gap-1.5 text-xs px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-semibold shadow-sm">
                <Download className="w-3.5 h-3.5"/> Download Results (Excel)
              </a>
            )}
          </div>

          {!compResult
            ? <div className="text-center py-10 text-slate-400 text-sm">No model selected for comparison.</div>
            : (
              <>
                {/* Best Model Banner */}
                {bestResult && (
                  <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-2xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                    <div>
                      <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">🏆 Best Model (Highest F1)</p>
                      <p className="text-xl font-bold">{bestResult.model_name}</p>
                      <p className="text-indigo-200 text-xs mt-0.5">{bestResult.timestamp?new Date(bestResult.timestamp).toLocaleString("en-US"):""} · {bestResult.algorithm_mode}</p>
                    </div>
                    <div className="flex gap-3">
                      {[{l:"F1-Score",v:bestResult.f1_score},{l:"Accuracy",v:bestResult.accuracy},{l:"MCC",v:bestResult.mcc}].map(m=>(
                        <div key={m.l} className="text-center bg-white/15 rounded-xl px-4 py-2">
                          <p className="text-2xl font-black">{m.v!=null?`${(m.v*100).toFixed(1)}%`:"—"}</p>
                          <p className="text-indigo-200 text-xs">{m.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comparison Table */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 mb-3">Training vs Testing Metrics</h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          {[
                            { h: "Metric",          k: null },
                            { h: "Training Value",  k: null },
                            { h: "Testing Value",   k: null },
                            { h: "Difference",      k: null },
                          ].map((col, i) => (
                            <th key={i} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                              <span className="flex items-center">{col.h}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {[
                          { metric: "Accuracy",  key_r: "accuracy",  mk: "accuracy" },
                          { metric: "Precision", key_r: "precision", mk: "precision" },
                          { metric: "Recall",    key_r: "recall",    mk: "recall" },
                          { metric: "F1-Score",  key_r: "f1_score",  mk: "f1" },
                          { metric: "Macro Average", key_r: "macro_average", mk: "macro_avg" },
                          { metric: "Weighted Average", key_r: "weighted_average", mk: "weighted_avg" },
                          { metric: "MCC",       key_r: "mcc",       mk: "mcc" },
                          { metric: "ROC-AUC",   key_r: "roc_auc",   mk: "roc_auc" },
                          { metric: "Mean Std",  key_r: "mean_std",  mk: "mean_std" },
                        ].map(row => {
                          const trainVal = compResult?.[row.key_r] ?? null;
                          const testVal  = matchTest?.[row.key_r] ?? null;
                          const diff     = trainVal != null && testVal != null ? ((testVal - trainVal)*100).toFixed(1) : null;
                          return (
                            <tr key={row.metric} className="hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-700 flex items-center gap-1">
                                {row.metric} <InfoBtn metricKey={row.mk}/>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("font-bold", trainVal>=0.8?"text-green-600":trainVal>=0.6?"text-amber-600":"text-slate-500")}>
                                  {trainVal != null ? `${(trainVal*100).toFixed(1)}%` : "—"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={cn("text-xs italic", testVal != null ? "font-bold not-italic " + (testVal>=0.8?"text-green-600":testVal>=0.6?"text-amber-600":"text-slate-500") : "text-slate-400")}>
                                  {testVal != null ? `${(testVal*100).toFixed(1)}%` : "N/A — test with labeled CSV"}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                {diff != null
                                  ? <span className={cn("text-xs font-bold", parseFloat(diff)>=0?"text-green-600":"text-red-500")}>{diff > 0 ? "+" : ""}{diff}%</span>
                                  : <span className="text-slate-300 text-xs">—</span>
                                }
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Advanced 9-Metric Comparison Chart (Train vs Test) */}
                <AdvancedComparisonChart compResult={compResult} matchTest={matchTest} />

                {/* Radar / Spider Chart */}
                <RadarComparisonChart compResult={compResult} matchTest={matchTest} />

                {/* Gap Badges Row */}
                <GapBadgesRow compResult={compResult} matchTest={matchTest} />

                {/* Overfitting Warning Panel */}
                <OverfitWarningPanel compResult={compResult} matchTest={matchTest} />
              </>
            )
          }
        </div>
      </div>

      {detailModal && <DetailModal result={detailModal} onClose={() => setDetailModal(null)} />}
      {viewHistory && <HistoryDetailModal histId={viewHistory} onClose={() => setViewHistory(null)} />}
    </div>
  );
}
