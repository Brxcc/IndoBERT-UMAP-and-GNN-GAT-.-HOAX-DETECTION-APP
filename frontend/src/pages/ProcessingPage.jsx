import { useState, useEffect, useRef } from "react";
import {
  Cpu, PlayCircle, Loader2, Trash2, Info, X,
  History, ChevronRight, ChevronLeft, Trophy,
  ToggleLeft, ToggleRight, Plus, Edit2, Check,
  BarChart2, Layers, FlaskConical
} from "lucide-react";
import { cn } from "../lib/utils";

const API = "http://localhost:8000/admin";

// ─── Rich Tooltip Modal ────────────────────────────────────────────────────────
function ParamModal({ title, definition, formula, interpretation, example, defaultText, desc, onClose }) {
  // Support both old simple desc and new rich 4-section format
  const hasRich = definition || formula || interpretation || example;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4 border border-slate-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg"><Info className="w-5 h-5 text-blue-600" /></div>
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        {hasRich ? (
          <div className="space-y-3">
            {definition && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Definition</p>
                <p className="text-sm text-slate-700 leading-relaxed">{definition}</p>
              </div>
            )}
            {formula && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-xs font-bold text-slate-400 mb-1">Formula</p>
                <code className="text-xs text-indigo-700 font-mono">{formula}</code>
              </div>
            )}
            {interpretation && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Interpretation</p>
                <p className="text-sm text-slate-600 leading-relaxed">{interpretation}</p>
              </div>
            )}
            {example && (
              <div className="bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <p className="text-xs font-bold text-amber-700 mb-1">Example</p>
                <p className="text-xs text-amber-800 leading-relaxed">{example}</p>
              </div>
            )}
            {defaultText && (
              <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg font-mono">
                Default / Recommended: <strong>{defaultText}</strong>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
            {defaultText && (
              <div className="bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg font-mono">
                Default / Recommended: <strong>{defaultText}</strong>
              </div>
            )}
          </div>
        )}
        <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition">Close</button>
      </div>
    </div>
  );
}

function InfoBtn({ title, desc, defaultText, definition, formula, interpretation, example }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-slate-400 hover:text-blue-500 transition ml-1 shrink-0 p-0.5" title="View Info">
        <Info className="w-4 h-4" />
      </button>
      {open && <ParamModal title={title} desc={desc} defaultText={defaultText}
        definition={definition} formula={formula} interpretation={interpretation} example={example}
        onClose={() => setOpen(false)} />}
    </>
  );
}

function Field({ label, children, desc, defaultText, required, definition, formula, interpretation, example }) {
  return (
    <div className="mb-4">
      <div className="flex items-center mb-1.5">
        <label className="text-xs font-bold text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {(desc || definition) && <InfoBtn title={label} desc={desc} defaultText={defaultText}
          definition={definition} formula={formula} interpretation={interpretation} example={example} />}
      </div>
      {children}
    </div>
  );
}

function ReadOnlyField({ value }) {
  return (
    <div className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-500 cursor-not-allowed font-medium">
      {value}
    </div>
  );
}

function SelectInput({ value, onChange, options, disabled }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full p-2 pr-8 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none bg-white font-medium"
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <div className="absolute right-3 top-3 pointer-events-none text-slate-400">
        <ChevronDown className="w-4 h-4" />
      </div>
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled, type = "text", step, min, max }) {
  return (
    <input
      type={type} step={step} min={min} max={max} disabled={disabled}
      className={cn(
        "w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition font-medium",
        disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : "bg-white"
      )}
      value={value === null || Number.isNaN(value) ? "" : value}
      onChange={onChange ? e => {
        if (type === "number") {
          const val = e.target.value;
          if (val === "") { onChange(""); }
          else { onChange(step ? parseFloat(val) : parseInt(val, 10)); }
        } else {
          onChange(e.target.value);
        }
      } : undefined}
      placeholder={placeholder}
    />
  );
}

function Toggle({ value, onChange, label, disabled }) {
  return (
    <button type="button" onClick={() => !disabled && onChange(!value)} disabled={disabled} className="flex items-center gap-2">
      {value
        ? <ToggleRight className={cn("w-8 h-8", disabled ? "text-blue-300" : "text-blue-500")} />
        : <ToggleLeft  className={cn("w-8 h-8", disabled ? "text-slate-200" : "text-slate-400")} />}
      <span className={cn("text-sm font-semibold", disabled ? "text-slate-400" : "text-slate-700")}>{label || (value ? "On" : "Off")}</span>
    </button>
  );
}

function GroupTitle({ children }) {
  return (
    <div className="bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl shadow-sm text-sm mb-5 flex items-center gap-2">
      <Layers className="w-4 h-4" /> {children}
    </div>
  );
}

function SubSectionTitle({ children }) {
  return (
    <h4 className="font-bold text-slate-600 text-sm border-b border-slate-200 pb-2 mb-4 uppercase tracking-wide mt-6">
      {children}
    </h4>
  );
}

function StepBar({ current, total }) {
  const steps = ["Config & Data Split Ratio Trial", "IndoBERT Parameters", "UMAP Parameters", "GAT Parameters", "Review & Run"];
  return (
    <div className="flex items-center justify-between w-full">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center">
          <div className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap",
            i === current ? "bg-blue-600 text-white shadow-lg" :
            i < current  ? "bg-blue-50 text-blue-600" : "text-slate-400 bg-slate-50"
          )}>
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] uppercase border",
              i === current ? "border-white/40" : i < current ? "border-blue-200" : "border-slate-200"
            )}>{i < current ? "✓" : i + 1}</span>
            <span className="hidden md:inline">{s}</span>
          </div>
          {i < total - 1 && <div className={cn("hidden md:block h-px w-6 mx-2", i < current ? "bg-blue-300" : "bg-slate-200")} />}
        </div>
      ))}
    </div>
  );
}

import { ChevronDown } from "lucide-react";

// ─── Data Split Ratio Trial Component ──────────────────────────────────────────
function SplitRatioTrial({ onBestRatioFound }) {
  const [train, setTrain] = useState(80);
  const [test,  setTest]  = useState(20);
  const [ratios, setRatios] = useState(["70/30", "80/20", "90/10"]);
  const [editIdx, setEditIdx] = useState(null);
  const [editTrain, setEditTrain] = useState(0);

  const [trialEpoch, setTrialEpoch] = useState(3);
  const [trialLR,    setTrialLR]    = useState("2e-5");
  const [trialRunning, setTrialRunning] = useState(false);
  const [trialResults, setTrialResults] = useState([]);
  const [bestRatio, setBestRatio] = useState(null);

  const syncTrain = (v) => { const n = Math.min(95, Math.max(50, parseInt(v) || 0)); setTrain(n); setTest(100 - n); };
  const syncTest = (v) => { const n = Math.min(50, Math.max(5, parseInt(v) || 0)); setTest(n); setTrain(100 - n); };

  const addRatio = () => {
    const ratio = `${train}/${test}`;
    if (!ratios.includes(ratio)) setRatios(p => [...p, ratio]);
  };
  const deleteRatio = (idx) => setRatios(p => p.filter((_, i) => i !== idx));

  const runTrial = async () => {
    if (ratios.length === 0) return alert("Add at least one split ratio first.");
    setTrialRunning(true);
    setTrialResults([]);
    try {
      const res = await fetch(`${API}/split-trial`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ratios, epoch: trialEpoch, learning_rate: parseFloat(trialLR) || 2e-5 }),
      });
      const data = await res.json();
      if (data.results) {
        setTrialResults(data.results);
        setBestRatio(data.best_ratio);
        if (onBestRatioFound) onBestRatioFound(data.best_ratio);
      }
    } catch { alert("Failed to connect to the server for trial."); }
    finally { setTrialRunning(false); }
  };

  return (
    <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <FlaskConical className="w-6 h-6 text-indigo-600" />
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Data Split Ratio Trial</h3>
          <p className="text-xs text-slate-500">Find the optimal Train/Test slice for your dataset before committing to full training.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">Train (%)</label>
              <input type="number" value={train} onChange={e => syncTrain(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-indigo-400" />
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-slate-700 block mb-1">Test (%)</label>
              <input type="number" value={test} onChange={e => syncTest(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-lg text-sm text-center font-bold focus:ring-2 focus:ring-rose-400" />
            </div>
            <button onClick={addRatio} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-indigo-700">Add</button>
          </div>
          <div className="border border-slate-200 bg-white rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr><th className="px-3 py-2 text-left">Train/Test Combinations</th><th className="px-3 py-2 text-right">Delete</th></tr>
              </thead>
              <tbody>
                {ratios.map((r, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-mono font-bold text-slate-700">{r}</td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => deleteRatio(i)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold text-slate-500 uppercase mb-3">Simulation Settings (Fast Pass)</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Field label="Simulation Epochs"><TextInput type="number" value={trialEpoch} onChange={setTrialEpoch} min={1} /></Field>
            <Field label="Simulated LR"><SelectInput value={trialLR} onChange={setTrialLR} options={["1e-5", "2e-5", "3e-5", "4e-5", "5e-5", "1e-4", "1e-3"]} /></Field>
          </div>
          <button onClick={runTrial} disabled={trialRunning || ratios.length === 0}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition">
            {trialRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
            {trialRunning ? "Running Rapid Trials..." : "Evaluate All Ratios"}
          </button>
        </div>
      </div>

      {trialResults.length > 0 && (
        <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {bestRatio && (
            <div className="p-3 bg-amber-50 text-amber-800 text-sm flex items-center gap-2 border-b border-amber-100">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Optimal ratio found: <strong>{bestRatio}</strong>. This has been automatically applied to your main configuration.</span>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>{["Ratio", "Best Epoch", "Accuracy", "F1-Score"].map(h => <th key={h} className="px-3 py-2 text-left font-bold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trialResults.map((r, i) => (
                <tr key={i} className={r.is_best ? "bg-amber-50" : ""}>
                  <td className="px-3 py-2 font-mono font-bold">{r.is_best && <Trophy className="w-3 h-3 text-amber-500 inline mr-1" />}{r.ratio}</td>
                  <td className="px-3 py-2">{r.best_epoch}</td>
                  <td className="px-3 py-2">{(r.accuracy * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2 font-bold text-blue-600">{(r.f1_score * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ProcessingPage() {
  const [step, setStep] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const pollingRef = useRef(null);

  const STEPS = 5;

  const [s, setS] = useState({
    // Identity & Setup
    model_name: "AntiHOAX_Model_v1",
    dataset_id: "",
    algorithm_mode: "hybrid",
    data_split_ratio: "80/20",

    // Group 1
    max_seq_length: 128,
    padding: "max_length",
    token_type_ids: false,

    // Group 2
    use_relu_hidden: false,
    hidden_dropout_prob: 0.1,
    attention_probs_dropout_prob: 0.1,
    indo_learning_rate: "2e-5",
    indo_batch_size: 16,
    indo_epoch: 3,
    indo_fold: 5,
    optimizer: "AdamW",
    beta1: 0.9,
    beta2: 0.999,
    epsilon: "1e-8",
    optuna_trials: 20,
    optuna_direction: "Maximize",
    optuna_metric: "F1-Score",
    grid_lr_values: "2e-5, 3e-5",
    grid_batch_values: "8, 16",
    grid_epoch_values: "3, 4",
    pbt_populationSize: 10,
    pbt_perturbInterval: 5,
    pbt_mutationRate: 0.2,
    weight_decay: 0.01,

    // NEW IndoBERT anti-overfitting params
    early_stopping_patience: 3,
    dropout_rate: 0.1,
    random_seed: 42,
    warmup_ratio: 0.1,
    indobert_hidden_dim: 768,
    indobert_num_heads: 12,

    // Group 3
    activation_function: "Softmax",
    softmax_temperature: 1.0,
    sigmoid_threshold: 0.5,
    output_dropout: 0.1,

    // UMAP
    enable_umap: true,
    n_components: 64,
    n_neighbors: 15,
    metric: "cosine",
    min_dist: 0.1,
    spread: 1.0,
    random_state: 42,

    // GAT
    enable_gat: true,
    edge_weight: false,
    graph_construction_method: "KNN-based",
    knn_k: 5,
    gat_num_layers: 2,
    gat_hidden_dim: 256,
    gat_num_heads: 8,
    gat_activation: "ELU",
    gat_negative_slope: 0.2,
    gat_dropout: 0.3,
    gat_lr: "1e-3",
    gat_weight_decay: "5e-4",
    gat_epochs: 50,
    gat_output_activation: "Softmax",
    gat_classifier_dropout: 0.5,
  });

  // Validation helpers
  const validateGAT = (hd, nh) => {
    const h = parseInt(hd) || 256, n = parseInt(nh) || 8;
    return h % n === 0 ? null : `GAT Hidden Dim (${h}) must be divisible by Num Heads (${n})`;
  };
  const validateIndoBERT = (hd, nh) => {
    const h = parseInt(hd) || 768, n = parseInt(nh) || 12;
    return h % n === 0 ? null : `IndoBERT Hidden Dim (${h}) must be divisible by Num Heads (${n})`;
  };

  const set = (k, v) => setS(p => ({ ...p, [k]: v }));

  useEffect(() => {
    fetch(`${API}/dataset/history`).then(r => r.json()).then(d => setDatasets(Array.isArray(d) ? d : [])).catch(() => {});
    loadHistory();
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const loadHistory = () => {
    fetch(`${API}/training/results`).then(r => r.json()).then(d => setHistory(Array.isArray(d) ? d : [])).catch(() => {});
  };



  const startTraining = async () => {
    if (!s.dataset_id) return alert("Select a dataset!");
    // Validate before sending
    const gatErr = validateGAT(s.gat_hidden_dim, s.gat_num_heads);
    if (gatErr) return alert(gatErr);
    const bertErr = validateIndoBERT(s.indobert_hidden_dim, s.indobert_num_heads);
    if (bertErr) return alert(bertErr);
    setLoading(true); setLogs([]); setStatusMsg("Initializing Pipeline...");
    try {
      const payload = {
        // Core
        dataset_id:       parseInt(s.dataset_id),
        model_name:       s.model_name,
        algorithm_mode:   s.algorithm_mode,
        data_split_ratio: s.data_split_ratio,
        train_ratio:      parseInt(s.data_split_ratio.split("/")[0]),
        test_ratio:       parseInt(s.data_split_ratio.split("/")[1]),

        // IndoBERT
        max_seq_length:       parseInt(s.max_seq_length) || 128,
        indo_learning_rate:   parseFloat(s.indo_learning_rate),
        indo_batch_size:      parseInt(s.indo_batch_size),
        indo_epoch:           parseInt(s.indo_epoch),
        indo_fold:            parseInt(s.indo_fold),
        weight_decay:         parseFloat(s.weight_decay) || 0.01,

        // NEW IndoBERT params
        early_stop_patience:  Math.max(1, parseInt(s.early_stopping_patience) || 3),
        dropout_rate:         Math.min(0.7, Math.max(0.0, parseFloat(s.dropout_rate) || 0.1)),
        random_seed:          Math.max(0, Math.min(99999, parseInt(s.random_seed) || 42)),
        warmup_ratio:         Math.min(0.5, Math.max(0.0, parseFloat(s.warmup_ratio) || 0.1)),
        indobert_hidden_dim:  parseInt(s.indobert_hidden_dim) || 768,
        indobert_num_heads:   parseInt(s.indobert_num_heads)  || 12,

        // UMAP — map short state keys → backend schema keys
        use_umap:           Boolean(s.enable_umap),
        umap_n_components:  parseInt(s.n_components)  || 64,
        umap_n_neighbors:   parseInt(s.n_neighbors)   || 15,
        umap_min_dist:      parseFloat(s.min_dist)    || 0.1,
        umap_metric:        s.metric  || "cosine",
        umap_random_state:  parseInt(s.random_state)  || 42,

        // GAT
        use_gat:           Boolean(s.enable_gat),
        gat_hidden_dim:    parseInt(s.gat_hidden_dim),
        gat_num_heads:     parseInt(s.gat_num_heads),
        gat_dropout:       parseFloat(s.gat_dropout),
        gat_learning_rate: parseFloat(s.gat_lr),
        gat_epochs:        parseInt(s.gat_epochs),
        gat_num_layers:    parseInt(s.gat_num_layers),
        knn_k:             parseInt(s.knn_k),
        graph_construction: s.graph_construction_method === "KNN-based" ? "knn" : "threshold",
      };
      const res = await fetch(`${API}/train-pipeline`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.job_id) {
        pollingRef.current = setInterval(async () => {
          const st = await fetch(`${API}/training/status/${data.job_id}`).then(r => r.json());
          if (st.status === "completed" || st.status === "error") {
            clearInterval(pollingRef.current);
            setStatusMsg(st.status === "completed" ? "✅ Pipeline Completed Successfully!" : `❌ Error: ${st.error_msg}`);
            setLoading(false);
            loadHistory();
          } else {
            setStatusMsg(`⏳ Running: ${st.status}...`);
          }
          if (st.logs) setLogs(st.logs);
        }, 3000);
      }
    } catch {
      setStatusMsg("❌ Network Error"); setLoading(false);
    }
  };

  const POPUPS = {
    // Group 1
    max_seq_length: "Maximum number of tokens per input sequence. Higher values capture more context but require more memory. Example: use 128 for short news headlines, 256 for full paragraphs.",
    tokenizer: "The tokenizer built into IndoBERT. Uses WordPiece algorithm to split text into subword tokens. This cannot be changed.",
    padding: "Determines how sequences are padded. max_length pads all sequences to Max Sequence Length. longest pads to the longest sequence in the batch. Example: use max_length for consistent tensor shapes.",
    truncation: "Sequences longer than Max Sequence Length are automatically truncated. Always enabled to prevent overflow errors.",
    input_ids: "Numerical representation of each token after tokenization. Automatically produced by the tokenizer.",
    attention_mask: "Binary mask (1 for real tokens, 0 for padding). Tells the model which tokens to attend to. Automatically produced by the tokenizer.",
    token_type_ids: "Optional segment IDs used for sentence-pair tasks (e.g., Question Answering). For single-sentence classification like hoax detection, this can be disabled. Example: enable for tasks like NLI where two sentences are compared.",
    // Group 2
    hidden_size: "The dimensionality of every hidden state in the encoder. Fixed at 768 for IndoBERT base. Larger models (e.g., IndoBERT large) use 1024.",
    num_hidden_layers: "Number of Transformer encoder layers stacked in IndoBERT. Each layer processes and refines the token representations.",
    use_relu_hidden: "If enabled, replaces the default GELU activation in intermediate layers with ReLU. Example: enabling ReLU may slightly speed up training but GELU generally performs better for language models.",
    num_attention_heads: "Number of parallel attention heads in each encoder layer. Each head attends to different parts of the input independently.",
    intermediate_size: "Size of the feed-forward network inside each Transformer block (4x hidden size). Fixed in IndoBERT base architecture.",
    hidden_activation: "Activation function used in the intermediate (feed-forward) layers. GELU is the default for BERT-based models and generally outperforms ReLU for NLP tasks.",
    hidden_dropout_prob: "Dropout rate applied to hidden layer outputs during training. Prevents overfitting. Example: 0.1 means 10% of neurons are randomly dropped per forward pass.",
    attention_probs_dropout_prob: "Dropout rate applied to attention weights. Regularizes the attention mechanism. Example: increase to 0.2 if the model shows signs of overfitting on attention patterns.",
    learning_rate: "Step size for updating model weights during backpropagation. Select from preset values to avoid input errors. Example: 2e-5 is the standard starting point for IndoBERT fine-tuning. Too high (e.g., 5e-4) causes divergence; too low (e.g., 1e-6) causes extremely slow learning.",
    batch_size: "Number of samples processed in one training iteration. Example: use 16 as a balanced default. Smaller batch (8) = more noisy updates but less memory; larger batch (32) = more stable but requires more GPU RAM.",
    epochs: "Number of complete passes through the training dataset. Example: 3–5 epochs is standard for fine-tuning BERT. More epochs risk overfitting; fewer epochs may underfit.",
    optimizer: "Optimization algorithm used to update model weights. Example: AdamW is recommended for BERT fine-tuning as it decouples weight decay. Optuna, Grid Search, and PBT are hyperparameter search strategies that automatically find optimal settings.",
    weight_decay: "L2 regularization coefficient applied to model weights (but not biases). Prevents overfitting by penalizing large weights. Example: 0.01 is a standard safe default. Values above 0.1 may over-regularize and hurt performance.",
    // Group 3
    classifier_input_size: "Dimensionality of the input vector fed into the classification head. Always matches Hidden Size (768) since it takes the [CLS] token representation from the last encoder layer.",
    num_labels: "Number of output classes. Fixed at 2 for binary hoax detection: class 0 = Not Hoax, class 1 = Hoax.",
    activation_function: "Final activation applied to the classifier output. Example: Softmax converts raw scores to a probability distribution summing to 1, suitable for multi-class. Sigmoid outputs independent probabilities per class, suitable for multi-label. For binary classification, both are valid.",
    temperature: "Scales logits before Softmax. Temperature < 1 makes distribution sharper (more confident), > 1 makes it softer. Example: use 1.0 as default; adjust only for confidence calibration.",
    threshold: "Decision boundary for binary classification. Predictions above this value are classified as Hoax. Example: lower to 0.4 if you want higher recall (catch more hoaxes); raise to 0.6 for higher precision.",
    loss_function: "Standard loss function for multi-class classification. Measures the difference between predicted probability distribution and the true label. Automatically handles the Softmax internally in PyTorch when used with raw logits.",
    output_dropout: "Dropout rate applied before the final classification layer. Example: 0.1 is a light regularization suitable when the dataset is large. Use 0.3 if the model shows overfitting on the validation set.",
    // UMAP
    n_components: "Number of dimensions in the reduced output space. Example: 64 dimensions retains most semantic information from IndoBERT's 768-dim embeddings while significantly reducing computational cost for GAT.",
    n_neighbors: "Number of neighboring points considered when building the manifold. Example: small values (5–10) emphasize local structure; large values (30–50) emphasize global structure.",
    metric: "Distance function used to measure similarity between data points. Example: cosine is recommended for text embeddings as it measures angular similarity regardless of magnitude.",
    min_dist: "Minimum distance allowed between points in the low-dimensional space. Example: 0.0–0.1 produces tight, well-separated clusters; 0.5–1.0 produces a more uniform, spread-out distribution.",
    spread: "Controls the effective scale of the embedded points. Works together with min_dist: spread sets the global scale while min_dist controls local cluster tightness. Example: increase spread to 1.5 if clusters appear too compressed.",
    random_state: "Seed value for the random number generator. Ensures UMAP produces the same output every run. Example: any fixed integer works; 42 is a common convention.",
    enable_umap: "If disabled, IndoBERT embeddings are passed directly to GAT without dimensionality reduction. Disable only if computational resources allow processing full 768-dim vectors.",
    // GAT
    node_features: "Dimensionality of node feature vectors. Each node represents a text sample, and its feature vector is the 768-dim [CLS] embedding from IndoBERT (or reduced dim if UMAP is enabled).",
    edge_index_format: "Graph edge representation format. COO stores edges as two arrays [source_nodes, target_nodes]. Required format for PyTorch Geometric. Edges are constructed from K-nearest neighbors of node embeddings.",
    edge_weight: "Optional scalar weight assigned to each edge, representing similarity strength between connected nodes. Example: enable and use cosine similarity score as edge weight to give more influence to highly similar node pairs.",
    graph_construction_method: "Method used to build edges between nodes. Example: KNN-based connects each node to its K most similar neighbors — efficient and scalable. Cosine Threshold connects nodes whose similarity exceeds a set threshold. Fully Connected creates edges between all node pairs — only feasible for small datasets.",
    knn_k: "Number of nearest neighbors each node is connected to when using KNN-based graph construction. Example: K=5 means each news article node is connected to its 5 most semantically similar articles.",
    num_gat_layers: "Number of stacked GAT layers. Each layer aggregates information from neighbors one hop away. Example: 2 layers = each node receives information from neighbors up to 2 hops away. More layers risk over-smoothing.",
    num_attention_heads_gat: "Number of independent attention heads per layer. Each head learns different relationship patterns. Example: 8 heads on layer 1 to capture diverse patterns; reduce to 1 on the final layer.",
    concat: "If True, outputs from all attention heads are concatenated, multiplying the output dimension by num_heads. If False (or on the last layer), outputs are averaged to maintain a fixed output size. The final GAT layer always uses concat=False.",
    out_features: "Output feature dimensionality per head for this layer. Example: if num_heads=8 and concat=True, actual output dim = out_features × 8.",
    gat_activation: "Non-linear activation applied after each GAT layer (except the last). Example: ELU is generally preferred over ReLU for graph networks as it handles negative values smoothly.",
    gat_negative_slope: "Slope coefficient for the negative part of LeakyReLU used inside the attention coefficient computation. Example: 0.2 is the standard value in the original GAT paper.",
    gat_dropout_node: "Dropout applied to node features between GAT layers. Example: 0.3 is a good starting point. Too high (>0.5) degrades performance; 0.0 means no regularization.",
    gat_dropout_attention: "Dropout applied specifically to attention coefficients during training. Prevents the model from over-relying on a small number of edges. Example: 0.1 provides light regularization on the graph attention mechanism.",
    gat_lr: "Learning rate for the GAT component optimizer. Kept separate from IndoBERT's learning rate because GAT is trained from scratch (no pretrained weights). Example: 1e-3 is standard for training graph networks from scratch. Use a lower value (1e-4) if the training loss oscillates.",
    gat_weight_decay: "L2 regularization coefficient for the GAT optimizer. Example: 5e-4 is a common default for graph neural networks. Increase to 1e-3 if overfitting is observed on the validation graph.",
    gat_epochs: "Number of training iterations for the GAT component. Example: 50–200 epochs is typical for GAT on medium-sized graphs. Use Early Stopping to avoid overfitting.",
    gat_num_classes: "Number of output classes. Fixed at 2 for binary hoax classification. The final GAT layer outputs a vector of size 2.",
    gat_output_activation: "Activation applied to final GAT output. Example: Softmax produces a probability distribution across 2 classes summing to 1. Sigmoid produces independent probabilities per class. For binary classification, both are valid — Softmax is recommended for consistency with IndoBERT's output head.",
    gat_loss_function: "Loss function used to train the GAT classifier. CrossEntropyLoss is standard for multi-class node classification and handles the Softmax computation internally when used with raw logits.",
    gat_classifier_dropout: "Dropout applied before the final classification layer in GAT. Example: 0.5 is commonly used in graph classification tasks. Tune down to 0.1 if the dataset is small and the model underfits.",
  };

  const renderCurrentStep = () => {
    switch(step) {
      // ───────────────────────────────────────────────────────────────────────
      // STEP 0: Configuration & Dataset Split
      // ───────────────────────────────────────────────────────────────────────
      case 0: return (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="mb-6 pb-6 border-b border-slate-200">
              <Field label="Load Past Configuration (Optional)">
                <SelectInput 
                  value={""} 
                  onChange={v => {
                    if (!v) return;
                    const target = history.find(h => h.id === parseInt(v));
                    if (target && target.settings_json) {
                       try {
                         const parsed = JSON.parse(target.settings_json);
                         setS(prev => ({...prev, ...parsed}));
                         alert("Configuration loaded successfully! You can press Next Step to review.");
                       } catch { alert("Failed to parse past configuration"); }
                    }
                  }} 
                  options={[
                    {value: "", label: "-- Start Fresh / Keep Current --"},
                    ...history.map(h => ({value: h.id, label: `${h.model_name} - ${h.algorithm_mode} (${new Date(h.timestamp).toLocaleString("en-US")})`}))
                  ]} 
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <Field label="Model Name" required>
                <TextInput value={s.model_name} onChange={v => set("model_name", v)} />
              </Field>
              <Field label="Dataset" required>
                <SelectInput value={s.dataset_id} onChange={v => set("dataset_id", v)}
                  options={[{value:"", label: "-- Select Dataset --"}, ...datasets.map(d=>({value: d.id, label: `${d.dataset_label || d.name} (${d.total_entries} rows)`}))]} />
              </Field>
              <Field label="Algorithm Pipeline" required>
                <SelectInput value={s.algorithm_mode} onChange={v => {
                  set("algorithm_mode", v);
                  if (v === "indobert_only") { set("enable_umap", false); set("enable_gat", false); }
                  if (v === "indobert_umap") { set("enable_umap", true); set("enable_gat", false); }
                  if (v === "hybrid") { set("enable_umap", true); set("enable_gat", true); }
                }} options={[
                  {value: "hybrid", label: "IndoBERT + UMAP + GAT (Hybrid)"},
                  {value: "indobert_umap", label: "IndoBERT + UMAP Only"},
                  {value: "indobert_only", label: "IndoBERT Only"}
                ]} />
              </Field>
              <Field label="Selected Data Split (Train/Test)">
                <div className="flex gap-2">
                  <TextInput value={s.data_split_ratio} onChange={v=>set("data_split_ratio", v)} placeholder="e.g., 80/20" />
                </div>
              </Field>
            </div>
          </div>
          <SplitRatioTrial onBestRatioFound={(ratio) => set("data_split_ratio", ratio)} />
        </div>
      );

      // ───────────────────────────────────────────────────────────────────────
      // STEP 1: IndoBERT Parameter Settings
      // ───────────────────────────────────────────────────────────────────────
      case 1: return (
        <div className="space-y-8 animate-in fade-in">
          {/* Group 1 */}
          <div>
            <GroupTitle>Group 1 — Input Layer (Tokenizer & Embedding Input)</GroupTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Max Sequence Length"
                definition="The maximum number of tokens (subwords) that the model will process from each input text. Tokens beyond this length are truncated."
                formula="text → tokenize → truncate to max_seq_length tokens"
                interpretation="Higher values capture more context but require more GPU memory and slow down training. For most news articles, 128 tokens is sufficient."
                example="Use 128 for short news headlines. Use 256 for full paragraphs. Use 512 for very long documents (requires more GPU RAM)."
                defaultText="128">
                <SelectInput value={s.max_seq_length} onChange={v => set("max_seq_length", parseInt(v))} options={[128, 256, 512]} />
              </Field>
              <Field label="Tokenizer"
                definition="The tokenization algorithm built into IndoBERT. Uses WordPiece to split text into subword tokens, handling Indonesian vocabulary and out-of-vocabulary words."
                formula="text → WordPiece → [CLS] token_1 ... token_N [SEP]"
                interpretation="This is fixed and cannot be changed. The WordPiece tokenizer ensures compatibility with the IndoBERT pretrained weights."
                example="'Berita hoaks menyebar' → ['[CLS]', 'ber', '##ita', 'ho', '##aks', 'me', '##nye', '##bar', '[SEP]']">
                <ReadOnlyField value="IndoBERT WordPiece Tokenizer" />
              </Field>
              <Field label="Padding"
                definition="Determines how sequences shorter than max_seq_length are padded with the special [PAD] token to create uniform-length tensors for batch processing."
                formula="padded_seq = tokens + [[PAD]] × (max_len - len(tokens))"
                interpretation="max_length pads all sequences to max_seq_length (uniform tensors). longest pads to the longest sequence in the batch (more efficient but variable sizes)."
                example="Use max_length for consistent tensor shapes (required for most GPU training). Use longest only if batch size is 1 or variable lengths are acceptable.">
                <SelectInput value={s.padding} onChange={v => set("padding", v)} options={["max_length", "longest"]} />
              </Field>
              <Field label="Truncation"
                definition="Sequences longer than max_seq_length are automatically cut to fit. This prevents memory overflow and is always enabled."
                formula="truncated_seq = tokens[:max_seq_length]"
                interpretation="Always enabled to prevent GPU out-of-memory errors. Long documents lose their tail content — for very long texts, consider increasing max_seq_length."
                example="A 300-word article with max_seq_length=128 will have its last ~170 words truncated. Use 256 or 512 if article endings are important for classification.">
                <ReadOnlyField value="True" />
              </Field>
              <Field label="Input IDs"
                definition="Numerical representation of each token after tokenization. Each token in the IndoBERT vocabulary has a unique integer ID."
                formula="token → vocab_id (integer) | vocabulary size ≈ 31,943 for IndoBERT"
                interpretation="Auto-generated by the tokenizer. These integer IDs are looked up in the embedding table to get 768-dim dense vectors."
                example="['[CLS]', 'berita', 'hoaks'] → [2, 4521, 8923] (example IDs). Automatically produced — no manual configuration needed.">
                <ReadOnlyField value="Auto-generated" />
              </Field>
              <Field label="Attention Mask"
                definition="Binary mask (1 for real tokens, 0 for padding) that tells the attention mechanism which tokens to attend to and which to ignore."
                formula="mask_i = 1 if token_i ≠ [PAD] else 0"
                interpretation="Without this mask, the model would waste attention capacity on padding tokens. Automatically produced — no manual configuration needed."
                example="Sequence: [CLS, berita, hoaks, PAD, PAD] → Mask: [1, 1, 1, 0, 0]. Real tokens get full attention; padding is ignored.">
                <ReadOnlyField value="Auto-generated" />
              </Field>
              <Field label="Token Type IDs"
                definition="Optional segment IDs (0 or 1) used to distinguish between two sentences in sentence-pair tasks like Question Answering or Natural Language Inference."
                formula="segment_A = 0, segment_B = 1 (for sentence-pair tasks)"
                interpretation="For single-sentence classification (hoax detection), Token Type IDs are not needed and can be disabled. Enabling them adds no benefit for single-sentence tasks."
                example="Disable for hoax detection (single sentence). Enable only for tasks comparing two texts (e.g., checking if article A contradicts article B).">
                <Toggle value={s.token_type_ids} onChange={v => set("token_type_ids", v)} />
              </Field>
            </div>
          </div>

          {/* Group 2 */}
          <div className="pt-4">
            <GroupTitle>Group 2 — Hidden Layer (IndoBERT Encoder + Fine-Tuning)</GroupTitle>
            <SubSectionTitle>Architecture (Fixed — IndoBERT Base)</SubSectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Hidden Size"
                definition="The dimensionality of the hidden representation at every position in the IndoBERT encoder stack. Determines the size of the token embedding vectors."
                formula="h \u2208 \u211d^768 for IndoBERT base (fixed)"
                interpretation="Fixed at 768 for IndoBERT base. This is the output size of each transformer encoder layer and is the input size for the classification head."
                example="768 is standard for BERT-base. Larger models (BERT-large, IndoBERT-large) use 1024. Cannot be changed without retraining from scratch.">
                <ReadOnlyField value="768" />
              </Field>
              <Field label="Num Hidden Layers"
                definition="The number of stacked Transformer encoder layers in the IndoBERT architecture. Each layer applies multi-head self-attention followed by a feed-forward network."
                formula="output = TransformerLayer_12(...TransformerLayer_1(embeddings))"
                interpretation="12 layers for IndoBERT base (fixed). More layers = deeper representations but more compute. The last layer's [CLS] token is used for classification."
                example="IndoBERT base has 12 layers. Each layer refines the token representations. Layer 12's output is typically most task-specific for fine-tuning.">
                <ReadOnlyField value="12" />
              </Field>
              <Field label="Use ReLU on Hidden Layers"
                definition="If enabled, replaces the default GELU activation in intermediate layers with ReLU. Affects the feed-forward network inside each Transformer block."
                formula="GELU(x) = x\u03a6(x) vs ReLU(x) = max(0, x)"
                interpretation="GELU is the default and generally performs better for language models. ReLU may slightly speed up training but can hurt NLP performance."
                example="Leave disabled (GELU) for best results with IndoBERT. Only enable ReLU if experimenting with speed/performance trade-offs on your specific dataset.">
                <Toggle value={s.use_relu_hidden} onChange={v => set("use_relu_hidden", v)} />
              </Field>
              <Field label="Num Attention Heads"
                definition="The number of parallel attention heads in each encoder layer. Each head attends to different positional and semantic relationships independently."
                formula="MultiHead(Q,K,V) = Concat(head_1,...,head_12)W^O, head_i = Attention(QW^Q_i, KW^K_i, VW^V_i)"
                interpretation="Fixed at 12 for IndoBERT base. Each head specializes in different linguistic patterns (e.g., syntax, co-reference, proximity)."
                example="IndoBERT base: 12 heads, each with 64-dim (768/12). This is the core BERT architecture and cannot be changed without full retraining.">
                <ReadOnlyField value="12" />
              </Field>
              <Field label="Intermediate Size"
                definition="The size of the feed-forward network hidden layer inside each Transformer block. Always 4× the hidden size for standard BERT."
                formula="FFN(x) = max(0, xW_1 + b_1)W_2 + b_2, W_1 \u2208 \u211d^(768\u00d73072)"
                interpretation="Fixed at 3072 for IndoBERT base (4 × 768). This bottleneck-expansion pattern is the standard BERT design and cannot be changed."
                example="768 hidden → 3072 intermediate → 768 output. This FFN runs inside every encoder layer after the attention sub-layer.">
                <ReadOnlyField value="3072" />
              </Field>
              <Field label="Hidden Activation"
                definition="Activation function applied inside the intermediate (feed-forward) layer of each Transformer block. Determined by the Use ReLU toggle above."
                formula="GELU: f(x) = x \u00d7 \u03a6(x) | ReLU: f(x) = max(0, x)"
                interpretation="GELU is the default for BERT-based models and generally outperforms ReLU for NLP tasks due to smoother gradients near zero."
                example="GELU (default) is recommended. Only use ReLU if you specifically need faster inference and accept potential performance loss.">
                <ReadOnlyField value={s.use_relu_hidden ? "ReLU" : "GELU"} />
              </Field>
              <Field label="Hidden Dropout Probability"
                definition="Dropout rate applied to hidden layer outputs after each encoder layer during training. Prevents overfitting in the IndoBERT transformer stack."
                formula="P(hidden unit active) = 1 − hidden_dropout_prob"
                interpretation="A value of 0.1 means 10% of hidden units are randomly zeroed per forward pass. Increasing this adds regularization to the encoder."
                example="0.1 (default) is standard for BERT fine-tuning. Try 0.15–0.2 if you observe overfitting in the encoder layers."
                defaultText="0.1">
                <TextInput type="number" step="0.1" value={s.hidden_dropout_prob} onChange={v => set("hidden_dropout_prob", v)} />
              </Field>
              <Field label="Attention Dropout Probability"
                definition="Dropout rate applied to attention weights inside each transformer head during training. Prevents the model from over-relying on specific token relationships."
                formula="P(attention weight retained) = 1 − attention_probs_dropout_prob"
                interpretation="Regularizes the attention mechanism itself. Slightly higher than hidden dropout can help in attention-heavy tasks."
                example="0.1 is the standard default for BERT. Try 0.15–0.2 if the model over-relies on specific token pairs (high attention concentration)."
                defaultText="0.1">
                <TextInput type="number" step="0.1" value={s.attention_probs_dropout_prob} onChange={v => set("attention_probs_dropout_prob", v)} />
              </Field>
            </div>

            <SubSectionTitle>Fine-Tuning Parameters</SubSectionTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Learning Rate"
                definition="Controls how large a step the optimizer takes when adjusting model weights based on the loss gradient."
                formula="θ_{t+1} = θ_t − lr × ∇L(θ_t)"
                interpretation="Too high = unstable training (loss oscillates). Too low = slow convergence (may not reach optimum)."
                example="lr=2e-5 is standard for fine-tuning transformers. For GNN training from scratch, lr=1e-3 is typical. Halve the LR if loss is unstable."
                defaultText="2e-5">
                <SelectInput value={s.indo_learning_rate} onChange={v => set("indo_learning_rate", v)} options={["2e-5", "3e-5", "4e-5", "5e-5"]} />
              </Field>
              <Field label="Batch Size"
                definition="The number of training samples processed in each gradient update step."
                formula="gradient = (1/batch_size) × Σ ∇L(x_i, y_i)"
                interpretation="Larger batches = more stable gradients but higher memory use. Smaller batches = noisier but often generalizes better."
                example="batch_size=16 balances speed and stability for most NLP tasks. If GPU memory is limited, use 8. If training is unstable, try 32."
                defaultText="16">
                <SelectInput value={s.indo_batch_size} onChange={v => set("indo_batch_size", parseInt(v))} options={[8, 16, 32]} />
              </Field>
              <Field label="Epochs"
                definition="The total number of complete passes through the training dataset."
                formula="total_steps = num_epochs × steps_per_epoch"
                interpretation="More epochs = model sees more data repetitions. Combine with Early Stopping to avoid wasting compute."
                example="10 epochs is a common starting point. With early stopping patience=3, the model may stop at epoch 7 if no improvement is detected."
                defaultText="3–5">
                <SelectInput value={s.indo_epoch} onChange={v => set("indo_epoch", parseInt(v))} options={[3, 4, 5]} />
              </Field>
              <Field label="Cross-Val Folds"
                definition="Number of folds for Stratified K-Fold cross-validation. The dataset is split into K equal parts; K−1 parts train the model, and 1 part validates it, repeated K times."
                formula="CV Score = (1/K) × Σ Score_k"
                interpretation="More folds = more reliable estimate of generalization but longer training time. Fewer folds = faster but noisier estimate."
                example="K=5 is the standard default, balancing reliability and speed. Use K=10 for rigorous evaluation on larger datasets.">
                <SelectInput value={s.indo_fold} onChange={v => set("indo_fold", parseInt(v))} options={[2, 3, 5, 10]} />
              </Field>
              <Field label="Optimizer"
                definition="The optimization algorithm used to update model weights during backpropagation. Determines how gradients are used to minimize the loss."
                formula="AdamW: \u03b8_{t+1} = \u03b8_t - lr \u00d7 m_t/(\u221av_t + \u03b5) - lr \u00d7 \u03bb \u00d7 \u03b8_t"
                interpretation="AdamW is recommended for BERT fine-tuning as it decouples weight decay from the adaptive learning rate. Optuna/Grid Search/PBT are hyperparameter search strategies."
                example="Use AdamW (default) for standard fine-tuning. Use Optuna for automated hyperparameter search. Use Grid Search for exhaustive comparison of predefined values.">
                <SelectInput value={s.optimizer} onChange={v => set("optimizer", v)} options={["AdamW", "Adam", "Optuna (Auto-Tuning)", "Grid Search", "Population Based Training"]} />
              </Field>
            </div>

            {/* Dynamic Optimizer Params */}
            <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              {(s.optimizer === "AdamW" || s.optimizer === "Adam") && (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Beta 1" defaultText="0.9"><TextInput type="number" step="0.01" value={s.beta1} onChange={v=>set("beta1",v)}/></Field>
                  <Field label="Beta 2" defaultText="0.999"><TextInput type="number" step="0.001" value={s.beta2} onChange={v=>set("beta2",v)}/></Field>
                  <Field label="Epsilon" defaultText="1e-8"><SelectInput value={s.epsilon} onChange={v=>set("epsilon",v)} options={["1e-8", "1e-7", "1e-6"]} /></Field>
                </div>
              )}
              {s.optimizer === "Optuna (Auto-Tuning)" && (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Number of Trials" defaultText="20"><TextInput type="number" value={s.optuna_trials} onChange={v=>set("optuna_trials",v)}/></Field>
                  <Field label="Search Direction"><SelectInput value={s.optuna_direction} onChange={v=>set("optuna_direction",v)} options={["Maximize","Minimize"]} /></Field>
                  <Field label="Metric to Optimize"><SelectInput value={s.optuna_metric} onChange={v=>set("optuna_metric",v)} options={["Accuracy","F1-Score"]} /></Field>
                </div>
              )}
              {s.optimizer === "Grid Search" && (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Learning Rate values (comma separated)"><TextInput value={s.grid_lr_values} onChange={v=>set("grid_lr_values",v)}/></Field>
                  <Field label="Batch Size values"><TextInput value={s.grid_batch_values} onChange={v=>set("grid_batch_values",v)}/></Field>
                  <Field label="Epoch values"><TextInput value={s.grid_epoch_values} onChange={v=>set("grid_epoch_values",v)}/></Field>
                </div>
              )}
              {s.optimizer === "Population Based Training" && (
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Population Size" defaultText="10"><TextInput type="number" value={s.pbt_populationSize} onChange={v=>set("pbt_populationSize",v)}/></Field>
                  <Field label="Perturbation Interval" defaultText="5"><TextInput type="number" value={s.pbt_perturbInterval} onChange={v=>set("pbt_perturbInterval",v)}/></Field>
                  <Field label="Mutation Rate" defaultText="0.2"><TextInput type="number" step="0.1" value={s.pbt_mutationRate} onChange={v=>set("pbt_mutationRate",v)}/></Field>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2">
              <Field label="Weight Decay"
                definition="L2 regularization coefficient applied to model weights (not biases). Penalizes large weights to prevent overfitting."
                formula="L_total = L_task + weight_decay × Σ ||w_i||²"
                interpretation="Higher values = stronger regularization. Too high can over-regularize and hurt performance."
                example="weight_decay=0.01 is a standard safe default. Values above 0.1 may over-regularize and hurt performance."
                defaultText="0.01">
                <SelectInput value={s.weight_decay} onChange={v => set("weight_decay", parseFloat(v))} options={["0.0", "0.01", "0.02", "0.05", "0.1"]} />
              </Field>
            </div>
          </div>

          {/* Anti-Overfitting & Reproducibility */}
          <div className="pt-4">
            <GroupTitle>Anti-Overfitting &amp; Reproducibility Parameters</GroupTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Early Stopping Patience"
                definition="The number of consecutive epochs without improvement in validation loss before training is automatically halted."
                formula="If val_loss[epoch] >= best_val_loss for N consecutive epochs → stop training"
                interpretation="Lower value stops sooner (saves time, risks underfitting). Higher value gives the model more chances to improve (risks overfitting)."
                example="Set patience=3 if your dataset is small (<5000 samples). Set patience=5–10 for larger datasets to allow gradual convergence."
                defaultText="3">
                <TextInput type="number" value={s.early_stopping_patience} min={1} max={20}
                  onChange={v => set("early_stopping_patience", Math.max(1, parseInt(v)||3))} />
              </Field>
              <Field label="Dropout Rate"
                definition="The probability that any given neuron's output is set to zero during training, forcing the network to learn more robust features."
                formula="P(neuron active) = 1 - dropout_rate"
                interpretation="Higher dropout = stronger regularization = less overfitting. Too high causes underfitting."
                example="dropout=0.1 means 10% of neurons are randomly disabled each forward pass. If training accuracy >> test accuracy (gap > 10%), try increasing to 0.3–0.5."
                defaultText="0.1">
                <TextInput type="number" step="0.05" value={s.dropout_rate} min={0.0} max={0.7}
                  onChange={v => set("dropout_rate", Math.min(0.7, Math.max(0.0, parseFloat(v)||0.1)))} />
              </Field>
              <Field label="Random Seed"
                definition="A fixed starting point for all random number generators, ensuring that your experiment produces identical results every time you run it with the same settings."
                formula="seed → controls weight init, data shuffle, dropout masks"
                interpretation="Use the same seed to reproduce published results. Change the seed to check if results are stable across different random initializations."
                example="seed=42 is a common default. If your results vary wildly between runs, fixing the seed helps isolate whether variation is due to model design or randomness."
                defaultText="42">
                <TextInput type="number" value={s.random_seed} min={0} max={99999}
                  onChange={v => set("random_seed", Math.max(0, Math.min(99999, parseInt(v)||42)))} />
              </Field>
              <Field label="Warmup Ratio"
                definition="The fraction of total training steps during which the learning rate gradually increases from 0 to its target value, preventing large gradient updates at the start of training."
                formula="warmup_steps = warmup_ratio × (epochs × steps_per_epoch)"
                interpretation="A warmup ratio of 0.1 means the first 10% of training uses a rising learning rate. This stabilizes early training, especially for pre-trained models like IndoBERT."
                example="With 100 total steps and warmup_ratio=0.1, the LR warms up for the first 10 steps, then decays. Recommended range: 0.05–0.2 for fine-tuning transformers."
                defaultText="0.1">
                <TextInput type="number" step="0.01" value={s.warmup_ratio} min={0.0} max={0.5}
                  onChange={v => set("warmup_ratio", Math.min(0.5, Math.max(0.0, parseFloat(v)||0.1)))} />
              </Field>
              <Field label="IndoBERT Hidden Dimension"
                definition="The size of the hidden dimension for projection and adapter layers added ON TOP of IndoBERT. Does NOT alter the core pretrained architecture (fixed at 768)."
                formula="Linear(768 → indobert_hidden_dim) → attention → classifier"
                interpretation="Controls the capacity of custom adapter layers. Must be divisible by IndoBERT Attention Heads."
                example="Default=768 matches IndoBERT base output. Use 512 for a lighter adapter. Always ensure: hidden_dim ÷ num_heads = integer."
                defaultText="768">
                <TextInput type="number" value={s.indobert_hidden_dim} min={64} max={2048}
                  onChange={v => set("indobert_hidden_dim", parseInt(v)||768)} placeholder="e.g. 768" />
                {validateIndoBERT(s.indobert_hidden_dim, s.indobert_num_heads) && (
                  <p className="text-red-500 text-xs mt-1">{validateIndoBERT(s.indobert_hidden_dim, s.indobert_num_heads)}</p>
                )}
              </Field>
              <Field label="IndoBERT Attention Heads (Adapter Layer)"
                definition="Number of attention heads in the custom adapter layers added on top of IndoBERT. Does NOT alter the 12 heads in the core pretrained model."
                formula="hidden_dim must be divisible by num_heads"
                interpretation="More heads = richer representation in adapter layers. Must evenly divide IndoBERT Hidden Dimension."
                example="Default=12 matches IndoBERT base. If hidden_dim=512, use num_heads=8 (512 ÷ 8 = 64). A validation error appears if divisibility fails."
                defaultText="12">
                <TextInput type="number" value={s.indobert_num_heads} min={1} max={64}
                  onChange={v => set("indobert_num_heads", parseInt(v)||12)} placeholder="e.g. 12" />
                {validateIndoBERT(s.indobert_hidden_dim, s.indobert_num_heads) && (
                  <p className="text-red-500 text-xs mt-1">{validateIndoBERT(s.indobert_hidden_dim, s.indobert_num_heads)}</p>
                )}
              </Field>
            </div>
          </div>

          {/* Group 3 */}
          <div className="pt-4">
            <GroupTitle>Group 3 — Output Layer (Classification Head)</GroupTitle>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
              <Field label="Classifier Input Size"
                definition="The dimensionality of the input vector fed into the classification head. Always 768 since it takes the [CLS] token representation from the last IndoBERT encoder layer."
                formula="clf_input = last_hidden_state[:, 0, :] \u2208 \u211d^768"
                interpretation="Fixed at 768 for IndoBERT base. This is the [CLS] token embedding from layer 12, which encodes the full sentence representation used for classification."
                example="The [CLS] token at position 0 aggregates sentence-level information. After 12 transformer layers, it represents the full semantic context of the input text.">
                <ReadOnlyField value="768" />
              </Field>
              <Field label="Num Labels"
                definition="The number of output classes for the IndoBERT classification head. Fixed at 2 for binary hoax detection."
                formula="P(class) = Softmax(Linear(768 \u2192 2))[class]"
                interpretation="Binary classification: class 0 = Not Hoax (Fakta), class 1 = Hoax. The Softmax layer converts 2 logits into probabilities summing to 1."
                example="Fixed at 2 for this hoax detection system. If extending to multi-class (e.g., satire, misinformation, rumor), this would increase accordingly.">
                <ReadOnlyField value="2 (Hoax / Not Hoax)" />
              </Field>
              <Field label="Activation Function"
                definition="The final activation function applied to the classifier output logits to produce a probability distribution over the Hoax / Not-Hoax classes."
                formula="Softmax: P(k) = exp(z_k) / \u03a3 exp(z_j) | Sigmoid: P(k) = 1/(1+exp(-z_k))"
                interpretation="Softmax is recommended for binary/multi-class where classes are mutually exclusive. Sigmoid gives independent probabilities per class (multi-label use case)."
                example="Use Softmax for standard binary hoax detection. Use Sigmoid only if one article can simultaneously belong to multiple non-exclusive categories.">
                <SelectInput value={s.activation_function} onChange={v => set("activation_function", v)} options={["Softmax", "Sigmoid"]} />
              </Field>
              <div className="pt-1">
                {s.activation_function === "Softmax" && (
                  <Field label="Temperature"
                    definition="A scalar that divides the logits before applying Softmax. Controls the sharpness of the probability distribution."
                    formula="P(k) = exp(z_k / T) / \u03a3 exp(z_j / T), where T = temperature"
                    interpretation="T < 1: sharper distribution (more confident). T > 1: softer distribution (less confident, more uniform). T = 1 (default) means standard Softmax."
                    example="Keep T=1.0 (default). Use T=0.5 to make predictions more decisive. Use T=2.0 for softer predictions when confidence calibration is needed."
                    defaultText="1.0">
                    <TextInput type="number" step="0.1" value={s.softmax_temperature} onChange={v => set("softmax_temperature", v)} />
                  </Field>
                )}
                {s.activation_function === "Sigmoid" && (
                  <Field label="Threshold"
                    definition="Decision boundary for Sigmoid output. Predictions above this value are classified as Hoax; below are classified as Not Hoax."
                    formula="predicted_class = 1 if Sigmoid(z) > threshold else 0"
                    interpretation="Lower threshold = higher recall (catches more hoaxes but more false positives). Higher threshold = higher precision (fewer false alarms but may miss hoaxes)."
                    example="Default=0.5 is balanced. Lower to 0.4 if missing hoaxes is costly (higher recall). Raise to 0.6 if false alarms are costly (higher precision)."
                    defaultText="0.5">
                    <TextInput type="number" step="0.1" value={s.sigmoid_threshold} onChange={v => set("sigmoid_threshold", v)} />
                  </Field>
                )}
              </div>
              <Field label="Loss Function"
                definition="The objective function that measures the difference between the model's predicted probability distribution and the true label during training."
                formula="CrossEntropyLoss = −Σ y_i × log(p_i)"
                interpretation="Lower loss = better predictions. Combined with label smoothing, this prevents the model from becoming overconfident on training data."
                example="CrossEntropyLoss is the standard for multi-class classification. It internally applies log-softmax, so raw logits are passed as input.">
                <ReadOnlyField value="CrossEntropyLoss" /></Field>
              <Field label="Dropout"
                definition="Dropout rate applied before the final classification layer in the IndoBERT output head. Randomly zeroes outputs to prevent the classifier from memorizing training patterns."
                formula="P(classifier input retained) = 1 − output_dropout"
                interpretation="Higher dropout = stronger regularization before the final prediction. Particularly effective when the classifier head is large."
                example="0.1 is light regularization suitable for large datasets. Use 0.3 if the model shows overfitting on the validation set's final predictions."
                defaultText="0.1">
                <SelectInput value={s.output_dropout} onChange={v => set("output_dropout", parseFloat(v))} options={[0.1, 0.2, 0.3]} />
              </Field>
            </div>
          </div>

        </div>
      );

      // ───────────────────────────────────────────────────────────────────────
      // STEP 2: UMAP Parameters
      // ───────────────────────────────────────────────────────────────────────
      case 2: return (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl">
            <Field label="Enable UMAP"
              definition="Toggle UMAP dimensionality reduction. When enabled, IndoBERT's 768-dim embeddings are compressed to a lower-dimensional space before being fed to the GAT."
              formula="IndoBERT(768D) \u2192 UMAP \u2192 embeddings(n_components D) \u2192 GAT"
              interpretation="Enabling UMAP reduces computational cost for GAT and can improve performance by removing noise from high-dimensional embeddings. Disable only if processing raw 768-dim vectors is feasible."
              example="Recommended to keep enabled (default). Disable only for the 'IndoBERT Only' mode or if experimenting with direct high-dimensional GAT input.">
              <Toggle value={s.enable_umap} onChange={v => set("enable_umap", v)} disabled={s.algorithm_mode === "indobert_only"} />
            </Field>
            {s.algorithm_mode === "indobert_only" && <p className="text-xs text-red-500 mt-2">UMAP is disabled globally because algorithm configuration is set to "IndoBERT Only".</p>}
          </div>

          <div className={cn("space-y-6 transition-opacity", (!s.enable_umap || s.algorithm_mode === "indobert_only") && "opacity-40 pointer-events-none")}>
            <div>
              <SubSectionTitle>Dimensionality Reduction</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="n_components (UMAP Output Dimensions)"
                  definition="The number of dimensions in the reduced output space. Typically 2 (for 2D visualization) or higher (for downstream models like GAT)."
                  formula="X_high_dim → X_low_dim ∈ ℝ^(n_components)"
                  interpretation="Use 2 for 2D visualization. Use higher values (e.g. 64) for feeding into GAT to preserve more semantic information."
                  example="n_components=2 is standard for visualization. If feeding UMAP output to GAT, try n_components=32–64 for richer representations."
                  defaultText="64">
                  <TextInput type="number" value={s.n_components} onChange={v => set("n_components", v)} />
                </Field>
                <Field label="n_neighbors (UMAP Neighbors)"
                  definition="The number of neighboring data points UMAP considers when building its graph representation of high-dimensional data."
                  formula="Balance between local structure (low n) and global structure (high n)"
                  interpretation="Low values (5–10) preserve fine local clusters. High values (50+) capture broader global topology."
                  example="n_neighbors=15 is a safe default. If your clusters appear too fragmented, increase to 30–50. If they merge, decrease to 5–10."
                  defaultText="15">
                  <TextInput type="number" value={s.n_neighbors} onChange={v => set("n_neighbors", v)} />
                </Field>
              </div>
            </div>
            <div>
              <SubSectionTitle>Distance & Density Control</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Metric"
                  definition="Distance function used to measure similarity between data points during UMAP graph construction."
                  formula="cosine: sim(u,v) = (u·v)/(||u||·||v||)"
                  interpretation="Cosine is recommended for text embeddings (angular similarity, magnitude-independent). Euclidean works better for normalized numerical data."
                  example="Use 'cosine' for IndoBERT text embeddings (standard). Use 'euclidean' for non-text numerical features.">
                  <SelectInput value={s.metric} onChange={v => set("metric", v)} options={["cosine", "euclidean", "manhattan", "correlation"]} />
                </Field>
                <Field label="Min Distance (min_dist)"
                  definition="Controls how tightly UMAP packs points together in the 2D/3D embedding. Smaller values allow tighter clusters."
                  formula="min_dist ∈ [0, 1]; 0 = maximum compaction"
                  interpretation="Low values create tight, well-separated clusters. High values spread points more evenly, showing continuous structure."
                  example="min_dist=0.1 produces compact clusters ideal for classification tasks. Use 0.5 for smoother visualizations of continuous data."
                  defaultText="0.1">
                  <TextInput type="number" step="0.1" value={s.min_dist} onChange={v => set("min_dist", v)} />
                </Field>
                <Field label="Spread"
                  definition="Controls the effective scale of the embedded points in the UMAP output space. Works together with min_dist to control cluster density."
                  formula="effective_distance = spread × learned_layout"
                  interpretation="Larger spread = points farther apart overall. Works with min_dist: spread sets global scale while min_dist controls local cluster tightness."
                  example="Keep spread=1.0 (default) for most cases. Increase to 1.5 if clusters appear too compressed in the 2D visualization."
                  defaultText="1.0">
                  <TextInput type="number" step="0.1" value={s.spread} onChange={v => set("spread", v)} />
                </Field>
              </div>
            </div>
            <div>
              <SubSectionTitle>Reproducibility</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Random State"
                  definition="Seed value for the random number generator. Ensures UMAP produces the same output every run."
                  formula="random_state → deterministic UMAP embedding"
                  interpretation="Use any fixed integer for reproducibility. Change it to test embedding stability."
                  example="Any fixed integer works; 42 is a common convention. Should match the global Random Seed for full reproducibility."
                  defaultText="42">
                  <TextInput type="number" value={s.random_state} onChange={v => set("random_state", v)} />
                </Field>
              </div>
            </div>
          </div>
        </div>
      );

      // ───────────────────────────────────────────────────────────────────────
      // STEP 3: GAT Parameters
      // ───────────────────────────────────────────────────────────────────────
      case 3: return (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-2xl">
            <Field label="Enable GAT"
              definition="Toggle the Graph Attention Network component. When enabled, text embeddings are organized as a graph and processed through GAT layers for relational reasoning."
              formula="Embeddings \u2192 KNN Graph \u2192 GATLayer_1 \u2192 ... \u2192 GATLayer_N \u2192 Classifier"
              interpretation="GAT is only available in Hybrid mode. Enabling it allows the model to learn from relationships between similar news articles (graph-level patterns)."
              example="Keep enabled for Hybrid mode. GAT typically improves accuracy by 2–5% over IndoBERT-only by leveraging inter-document relationships in the graph.">
              <Toggle value={s.enable_gat} onChange={v => set("enable_gat", v)} disabled={s.algorithm_mode !== "hybrid"} />
            </Field>
            {s.algorithm_mode !== "hybrid" && <p className="text-xs text-red-500 mt-2">GAT is disabled globally because algorithm configuration is not set to Hybrid.</p>}
          </div>

          <div className={cn("space-y-8 transition-opacity", (!s.enable_gat || s.algorithm_mode !== "hybrid") && "opacity-40 pointer-events-none")}>
            
            <div>
              <SubSectionTitle>Graph & Input Representation</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Node Features"
                  definition="The dimensionality of the feature vector representing each node in the graph. Each node corresponds to one text sample, and its features are the UMAP-reduced IndoBERT embeddings."
                  formula="x_i \u2208 \u211d^n_components (or \u211d^768 if UMAP disabled)"
                  interpretation="Node features encode the semantic content of each news article. The GAT layers learn to propagate and aggregate this information across connected nodes."
                  example="With UMAP enabled (n_components=64), each node is a 64-dim vector. With UMAP disabled, each node is 768-dim (full IndoBERT embedding).">
                  <ReadOnlyField value="768 (IndoBERT base output dimension)" />
                </Field>
                <Field label="Edge Index Format"
                  definition="The data format used to represent graph edges. COO (Coordinate Format) stores edges as two arrays: one for source nodes and one for destination nodes."
                  formula="edge_index = [[src_1,...,src_E], [dst_1,...,dst_E]] \u2208 \u2124^(2\u00d7E)"
                  interpretation="Required format for PyTorch Geometric. Edges are bidirectional and constructed from K-nearest neighbors of node embeddings based on cosine similarity."
                  example="With K=5 and N=100 nodes: edge_index has shape [2, 1000] (100 nodes \u00d7 5 neighbors \u00d7 2 directions). Automatically constructed — no manual input needed.">
                  <ReadOnlyField value="COO (Coordinate Format)" />
                </Field>
                <Field label="Edge Weight"
                  definition="Optional scalar weight on each edge representing the similarity strength between two connected nodes. Weights can influence how much attention each neighbor receives."
                  formula="edge_weight = cosine_similarity(x_i, x_j) \u2208 [0, 1]"
                  interpretation="Enabling edge weights allows the GAT to consider how similar two articles are, giving more influence to highly similar neighbor pairs."
                  example="Enable if you want article-similarity to scale the attention. Disable (default) if you want the GAT attention mechanism alone to determine neighbor importance.">
                  <Toggle value={s.edge_weight} onChange={v => set("edge_weight", v)} />
                </Field>
                <Field label="Graph Construction Method"
                  definition="The algorithm used to decide which node pairs are connected by edges in the graph. Determines the graph topology before GAT training begins."
                  formula="KNN: edges = {(i,j) | j \u2208 TopK(cosine_sim(x_i, x_j))}"
                  interpretation="KNN-based connects each node to its K most similar neighbors (efficient and scalable). Threshold connects nodes whose similarity exceeds a set cutoff. Fully Connected creates all-pairs edges (only for tiny datasets)."
                  example="Use KNN-based (default) for scalable, high-quality graphs. Use Cosine Threshold for sparser graphs. Avoid Fully Connected for datasets >500 samples.">
                  <SelectInput value={s.graph_construction_method} onChange={v => set("graph_construction_method", v)} options={["KNN-based", "Cosine Threshold", "Fully Connected"]} />
                </Field>
                <Field label="K (for KNN Graph)"
                  definition="The number of nearest neighbors each node (text sample) is connected to in the KNN graph. Higher K gives each node more context from similar samples."
                  formula="edges(i) = {j | j ∈ top-K nearest neighbors of i}"
                  interpretation="Larger K = denser graph, more context per node, but higher computational cost. Smaller K = sparser graph, faster but less context."
                  example="K=5 means each news article is connected to its 5 most similar articles. Use K=10 for richer graph context if training is not too slow."
                  defaultText="5">
                  <TextInput type="number" value={s.knn_k} onChange={v => set("knn_k", v)} />
                </Field>
              </div>
            </div>

            <div>
              <SubSectionTitle>GAT Architecture (Attention Mechanism)</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-4">
                <Field label="Num GAT Layers"
                  definition="How many stacked Graph Attention layers are used. Each layer allows information to propagate one more hop across the graph."
                  formula="h^(l+1) = GATLayer(h^(l), A)"
                  interpretation="More layers = information travels farther across the graph, but risks over-smoothing (all nodes become similar)."
                  example="2 layers is sufficient for most citation/social graphs. Try 3 layers if your graph has long-range dependencies. Avoid >4 layers without residual connections.">
                  <SelectInput value={s.gat_num_layers} onChange={v => set("gat_num_layers", parseInt(v))} options={[2, 3, 4]} />
                </Field>
                <Field label="GAT Hidden Dimensions"
                  definition="The size of the feature vector for each node inside the GAT layers. Larger dimensions allow the model to capture more complex graph patterns."
                  formula="node_feature ∈ ℝ^(gat_hidden_dim)"
                  interpretation="Larger = more expressive but needs more memory and data. Smaller = faster but may underfit on complex graphs."
                  example="hidden_dim=128 works for graphs with <10K nodes. For dense graphs try 256–512. Always ensure hidden_dim ÷ num_heads has no remainder."
                >
                  <TextInput type="number" value={s.gat_hidden_dim} min={16} max={4096}
                    onChange={v => set("gat_hidden_dim", parseInt(v) || 256)}
                    placeholder="e.g. 256" />
                  {validateGAT(s.gat_hidden_dim, s.gat_num_heads) && (
                    <p className="text-red-500 text-xs mt-1">{validateGAT(s.gat_hidden_dim, s.gat_num_heads)}</p>
                  )}
                </Field>
                <Field label="Num Attention Heads"
                  definition="The number of independent attention mechanisms in the Graph Attention Network. Each head learns to focus on different neighborhood features simultaneously."
                  formula="MultiHead(h) = Concat(head_1, ..., head_k)W^O, where each head_i attends independently"
                  interpretation="More heads = richer feature capture but higher memory cost. Fewer heads = faster training but may miss subtle graph patterns."
                  example="num_heads=4 is a balanced default. If your graph has very heterogeneous node types, try 8 heads. If training is slow, reduce to 2 heads."
                >
                  <TextInput type="number" value={s.gat_num_heads} min={1} max={64}
                    onChange={v => set("gat_num_heads", parseInt(v) || 8)}
                    placeholder="e.g. 8" />
                  {validateGAT(s.gat_hidden_dim, s.gat_num_heads) && (
                    <p className="text-red-500 text-xs mt-1">{validateGAT(s.gat_hidden_dim, s.gat_num_heads)}</p>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-6">
                <Field label="Activation Function"
                  definition="Non-linear activation applied after each hidden GAT layer (before the final output layer). Determines how node features are transformed after aggregation."
                  formula="ELU(x) = x if x > 0, else \u03b1(e^x - 1) | ReLU(x) = max(0, x)"
                  interpretation="ELU is generally preferred for graph networks as it handles negative values smoothly, preventing dead neurons. ReLU is simpler but can cause dying neuron problems."
                  example="Use ELU (default) for best results in graph classification. Use ReLU only if ELU is causing instability or you want faster computation.">
                  <SelectInput value={s.gat_activation} onChange={v => set("gat_activation", v)} options={["ELU", "ReLU"]} />
                </Field>
                <Field label="Negative Slope (LeakyReLU)"
                  definition="The slope coefficient for the negative half of LeakyReLU, used internally inside GAT attention coefficient computation (not the main activation)."
                  formula="LeakyReLU(x) = x if x > 0, else negative_slope \u00d7 x"
                  interpretation="Controls how much gradient flows for negative attention logits. The original GAT paper uses 0.2. Rarely needs adjustment."
                  example="Keep at 0.2 (standard value from original GAT paper). Only change if you observe instability in attention coefficient computation."
                  defaultText="0.2">
                  <TextInput type="number" step="0.1" value={s.gat_negative_slope} onChange={v => set("gat_negative_slope", v)} />
                </Field>
              </div>
            </div>

            <div>
              <SubSectionTitle>Regularization & Training</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="GAT Dropout"
                  definition="Dropout rate applied to node features between GAT layers. Randomly zeroes node feature values during training to prevent overfitting."
                  formula="P(node feature retained) = 1 − gat_dropout"
                  interpretation="Higher dropout = stronger regularization = less overfitting. Too high causes underfitting. Separate from the classifier dropout."
                  example="0.3 is a good starting point. Too high (>0.5) degrades performance; 0.0 means no regularization on graph features.">
                  <SelectInput value={s.gat_dropout} onChange={v => set("gat_dropout", parseFloat(v))} options={[0.0, 0.1, 0.2, 0.3, 0.4, 0.5]} />
                </Field>
                <Field label="Learning Rate (GAT)"
                  definition="Controls how large a step the GAT optimizer takes when adjusting model weights. Kept separate from IndoBERT's LR because GAT is trained from scratch."
                  formula="θ_{t+1} = θ_t − lr_gat × ∇L(θ_t)"
                  interpretation="Too high = unstable training (loss oscillates). Too low = slow convergence. GAT typically needs higher LR than fine-tuned transformers."
                  example="1e-3 is standard for training graph networks from scratch. Use a lower value (1e-4) if the training loss oscillates."
                  defaultText="1e-3">
                  <SelectInput value={s.gat_lr} onChange={v => set("gat_lr", v)} options={["1e-4", "5e-4", "1e-3", "5e-3", "1e-2"]} />
                </Field>
                <Field label="Weight Decay (GAT)"
                  definition="L2 regularization coefficient for the GAT optimizer. Prevents the GAT model from overfitting by penalizing large weights."
                  formula="L_total = L_task + gat_weight_decay × Σ ||w_i||²"
                  interpretation="Common values: 0 (no regularization), 5e-4 (standard), 1e-3 (stronger). Increase if GAT overfits."
                  example="5e-4 is a common default for graph neural networks. Increase to 1e-3 if overfitting is observed on the validation graph."
                  defaultText="5e-4">
                  <SelectInput value={s.gat_weight_decay} onChange={v => set("gat_weight_decay", v)} options={["0", "1e-4", "5e-4", "1e-3", "5e-3"]} />
                </Field>
                <Field label="GAT Epochs"
                  definition="Number of training iterations for the GAT component. Each epoch performs one complete pass through all training graph nodes."
                  formula="total_steps = gat_epochs × 1 (full-graph training per epoch)"
                  interpretation="More epochs = model sees data more. Use with Early Stopping to avoid overfitting without manual tuning."
                  example="50–200 epochs is typical for GAT on medium-sized graphs. Use Early Stopping patience=10–20 to avoid overfitting."
                  defaultText="50">
                  <TextInput type="number" value={s.gat_epochs} onChange={v => set("gat_epochs", v)} />
                </Field>
              </div>
            </div>

            <div>
              <SubSectionTitle>Output Layer (Classification)</SubSectionTitle>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <Field label="Num Classes"
                  definition="The number of output classes for the GAT classifier. Fixed at 2 for binary hoax detection: class 0 = Not Hoax, class 1 = Hoax."
                  formula="out \u2208 \u211d^num_classes (one logit per class)"
                  interpretation="Binary classification (Hoax vs Not-Hoax) requires exactly 2 classes. Softmax converts these 2 logits to probabilities summing to 1."
                  example="This is fixed at 2 for binary classification. If extending to multi-class (e.g., satire, misinformation, propaganda), this would increase.">
                  <ReadOnlyField value="2 (Hoax / Not Hoax)" />
                </Field>
                <Field label="Output Activation"
                  definition="Activation applied to the final GAT output layer to produce a probability distribution over classes."
                  formula="Softmax: p_i = exp(z_i) / \u03a3 exp(z_j)"
                  interpretation="Softmax produces probabilities summing to 1 (recommended for binary classification). Sigmoid produces independent probabilities per class."
                  example="Use Softmax for binary/multi-class classification where classes are mutually exclusive. Sigmoid is for multi-label tasks where multiple classes can be true simultaneously.">
                  <SelectInput value={s.gat_output_activation} onChange={v => set("gat_output_activation", v)} options={["Softmax", "Sigmoid"]} />
                </Field>
                <Field label="Loss Function"
                  definition="The objective function used to train the GAT classifier. Measures the gap between predicted probabilities and true class labels."
                  formula="CrossEntropyLoss = -\u03a3 y_i \u00d7 log(p_i) (with label smoothing applied)"
                  interpretation="Fixed at CrossEntropyLoss with label smoothing (0.1) for anti-overfitting. Lower loss = better predictions. Watch for loss divergence if LR is too high."
                  example="CrossEntropyLoss is the standard for multi-class node classification. Combined with label smoothing, it prevents the model from becoming overconfident.">
                  <ReadOnlyField value="CrossEntropyLoss" />
                </Field>
                <Field label="Classifier Dropout"
                  definition="Dropout applied before the final classification layer in the GAT model. Prevents the classifier from overfitting to training graph node patterns."
                  formula="P(classifier input retained) = 1 − gat_classifier_dropout"
                  interpretation="Higher values = more regularization before final predictions. Common in graph classification to prevent the last layer from memorizing training patterns."
                  example="0.5 is commonly used in graph classification tasks. Tune down to 0.1–0.2 if the dataset is small and the model underfits.">
                  <SelectInput value={s.gat_classifier_dropout} onChange={v => set("gat_classifier_dropout", parseFloat(v))} options={["0.1", "0.2", "0.3", "0.5"]} />
                </Field>
              </div>
            </div>

          </div>
        </div>
      );

      // ───────────────────────────────────────────────────────────────────────
      // STEP 4: Review & Start
      // ───────────────────────────────────────────────────────────────────────
      case 4: return (
        <div className="space-y-5 animate-in fade-in max-w-lg mx-auto flex flex-col items-center">
          {/* Card Engine */}
          <div className="w-full bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
            <h3 className="text-lg font-bold text-slate-800 mb-1.5">Execute Training Pipeline</h3>
            <p className="text-slate-500 text-sm mb-6">Confirm and launch training for <strong className="text-slate-800">{s.model_name}</strong> using <strong className="text-slate-800 uppercase">{s.algorithm_mode.replace('_', ' ')}</strong>.</p>
            <button onClick={startTraining} disabled={loading}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
              {loading ? "Processing..." : "Start Training"}
            </button>
          </div>
          
          {statusMsg && (
            <div className={cn("w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold border",
              statusMsg.includes("✅") ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
              statusMsg.includes("❌") ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-blue-50 border-blue-200 text-blue-700"
            )}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{statusMsg}</span>
            </div>
          )}

          {logs.length > 0 && (
            <div className="w-full mt-4 bg-white/80 backdrop-blur-sm border border-black overflow-hidden animate-in fade-in font-mono text-sm">
              <div className="h-80 overflow-y-auto">
                <table className="w-full text-black border-collapse">
                  <thead className="bg-white sticky top-0 z-10 border-b border-black">
                    <tr>
                      <th className="px-4 py-2 border-r border-black font-bold text-left w-1/4">Epoch</th>
                      <th className="px-4 py-2 border-r border-black font-bold text-left w-1/4">Accuracy</th>
                      <th className="px-4 py-2 border-r border-black font-bold text-left w-1/4">F1-Score</th>
                      <th className="px-4 py-2 font-bold text-left w-1/4">Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.slice().reverse().map((lg, i) => (
                      <tr key={i} className={cn("hover:bg-slate-100 transition border-b border-black last:border-b-0", lg.is_best ? "bg-slate-100 font-bold" : "")}>
                         <td className="px-4 py-2 border-r border-black">
                            {lg.epoch} {lg.is_best && <span className="ml-2 text-[10px] border border-black px-1 uppercase tracking-tighter shadow-[1px_1px_0_0_rgba(0,0,0,1)]">Best</span>}
                         </td>
                         <td className="px-4 py-2 border-r border-black">{(lg.akurasi * 100).toFixed(2)}%</td>
                         <td className="px-4 py-2 border-r border-black">{(lg.f1 * 100).toFixed(2)}%</td>
                         <td className="px-4 py-2">{lg.loss?.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {loading && <div className="text-black font-bold text-xs p-3 text-center border-t border-black bg-white animate-pulse">Waiting for next epoch stream...</div>}
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl"><Cpu className="w-8 h-8" /></div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Processing Pipeline</h2>
          <p className="text-slate-500 mt-1">Configure and train the advanced IndoBERT + UMAP + GAT architecture.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="mb-10 pb-6 border-b border-slate-100">
          <StepBar current={step} total={STEPS} />
        </div>
        
        <div className="min-h-[500px]">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <button onClick={() => setStep(p => Math.max(0, p - 1))} disabled={step === 0 || loading}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition disabled:opacity-40">
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          {step < STEPS - 1 && (
            <button onClick={() => setStep(p => Math.min(STEPS - 1, p + 1))} disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition">
              Next Step <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
