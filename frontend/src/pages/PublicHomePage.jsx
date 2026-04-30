import { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";
import { Table } from "../components/Table";
import { cn } from "../lib/utils";

export function PublicHomePage() {
  const [inputText, setInputText] = useState("");
  const [isUrl, setIsUrl] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  // Mock API Base
  const API_URL = "http://localhost:8000/public";

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handlePredict = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText, is_url: isUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult(data);
        fetchHistory(); // Refresh table
      } else {
        const errorData = await res.json();
        alert(errorData.detail || "Failed to process");
      }
    } catch (error) {
      console.error("Error connecting to backend", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { 
      header: "Text / URL", 
      accessor: "input_text",
      cell: (item) => <div className="max-w-md truncate" title={item.input_text}>{item.input_text}</div>
    },
    { 
      header: "Type", 
      accessor: "is_url",
      cell: (item) => (
        <span className="px-2 py-1 bg-slate-100 rounded text-xs">
          {item.is_url ? "News URL" : "News Text"}
        </span>
      )
    },
    { 
      header: "Prediction", 
      accessor: "prediction",
      cell: (item) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          (item.prediction === "Hoaks" || item.prediction === "Hoax") ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {(item.prediction === "Hoaks" || item.prediction === "Hoax") ? "Hoax" : "Non-Hoax"}
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
    <div className="min-h-screen bg-slate-50">
      {/* Minimalist Navbar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">AntiHOAX</h1>
        <a href="/admin/login" className="text-sm font-medium text-slate-500 hover:text-blue-600 transition">Admin Portal &rarr;</a>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold text-slate-800 tracking-tight">Check News Authenticity</h2>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Insert news text or a news URL to verify its authenticity using Machine Learning (GNN) technology.
          </p>
        </div>

        {/* Prediction Box */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <form onSubmit={handlePredict} className="space-y-6">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={!isUrl} 
                  onChange={() => setIsUrl(false)} 
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">News Text</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  checked={isUrl} 
                  onChange={() => setIsUrl(true)} 
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium text-slate-700">From Link (URL)</span>
              </label>
            </div>

            <div className="relative">
              {!isUrl ? (
                <textarea
                  required
                  placeholder="Type or paste the news text here..."
                  className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              ) : (
                <input
                  type="url"
                  required
                  placeholder="https://examplenews.com/hoax-article"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              {result ? (
                <div className="flex items-center gap-4 bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 fade-in">
                  <span className="font-medium text-slate-700">Result:</span>
                  <span className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm",
                    (result.prediction === "Hoaks" || result.prediction === "Hoax") ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                  )}>
                    {(result.prediction === "Hoaks" || result.prediction === "Hoax") ? "Hoax" : "Non-Hoax"} ({(result.probability * 100).toFixed(1)}%)
                  </span>
                </div>
              ) : (
                <div />
              )}
              
              <button 
                type="submit" 
                disabled={loading || !inputText.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? "Analyzing..." : "Find the Truth"}
              </button>
            </div>
          </form>
        </div>

        {/* History Table */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-800">Public Search History</h3>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <Table items={history} columns={columns} />
          </div>
        </div>
      </main>
    </div>
  );
}
