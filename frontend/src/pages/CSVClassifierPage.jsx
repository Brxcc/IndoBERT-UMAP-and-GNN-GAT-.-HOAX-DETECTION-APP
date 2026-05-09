import { useState } from "react";
import { FileUploader } from "../components/FileUploader";
import { Table } from "../components/Table";
import { Play, FileType, CheckCircle, Database } from "lucide-react";
import { cn } from "../lib/utils";

export function CSVClassifierPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [step, setStep] = useState(0);

  const steps = [
    "Text Preprocessing",
    "Embedding with IndoBERT",
    "Graph Construction (Similarity)",
    "Hybrid Fusion & Inference",
  ];

  const handleProcess = () => {
    if (!file) return;
    setLoading(true);
    setResults([]);
    setStep(0);

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      setStep(currentStep);
      
      if (currentStep >= steps.length) {
        clearInterval(interval);
        setLoading(false);
        // Mock results after processing
        setResults([
          { id: 1, text: "BOS funds in 2024 increased by 500% by the Minister, principals can buy official cars", label: "Hoax", probability: 0.98 },
          { id: 2, text: "Government launches BOS performance technical guidelines this year for pioneering schools", label: "Fact", probability: 0.05 },
          { id: 3, text: "Warning! Public school budgets will be abolished starting next month", label: "Hoax", probability: 0.96 },
        ]);
      }
    }, 800);
  };

  const columns = [
    { header: "ID", accessor: "id" },
    { header: "News Text", accessor: "text" },
    { 
      header: "Prediction", 
      accessor: "label",
      cell: (item) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          item.label === "Hoax" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {item.label}
        </span>
      )
    },
    { 
      header: "Probability", 
      accessor: "probability",
      cell: (item) => `${(item.probability * 100).toFixed(1)}%`
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <FileType className="text-blue-600 w-6 h-6" /> Batch CSV Classification
        </h3>
        
        <FileUploader file={file} onFileSelect={setFile} />

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleProcess}
            disabled={!file || loading}
            className={cn(
              "px-8 py-4 rounded-xl font-bold flex items-center gap-3 transition-all",
              file && !loading
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-xl hover:shadow-blue-500/20"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            )}
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Play className="w-5 h-5" />
            )}
            {loading ? "Processing Data..." : "Run Model"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-4">Pipeline Execution</h4>
          <div className="space-y-4">
            {steps.map((s, idx) => (
              <div key={idx} className="flex items-center gap-4">
                {step > idx ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : step === idx ? (
                  <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-200 shrink-0"></div>
                )}
                <span className={cn(
                  "font-medium",
                  step > idx ? "text-slate-800" : step === idx ? "text-blue-600" : "text-slate-400"
                )}>
                  {s}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.length > 0 && !loading && (
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 animate-in slide-in-from-bottom-5">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-bold text-lg flex items-center gap-3">
              <Database className="w-5 h-5 text-blue-500" />
              Classification Results
            </h4>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
              {results.length} Rows Processed
            </span>
          </div>
          <Table items={results} columns={columns} />
        </div>
      )}
    </div>
  );
}
