import { Card } from "../components/Card";
import { ShieldCheck, Zap, Database, Search } from "lucide-react";

export function HomePage() {
  const features = [
    {
      title: "Hybrid IndoBERT",
      description: "State-of-the-art IndoBERT text representation for deeply extracting the local context features of Indonesian news.",
      icon: Zap,
    },
    {
      title: "GNN Architecture",
      description: "Analyze the relationships between news articles with a Graph Neural Network to detect hoax information propagation patterns.",
      icon: ShieldCheck,
    },
    {
      title: "Batch CSV Processing",
      description: "Supports large batch classification using CSV datasets without needing to input text one by one.",
      icon: Database,
    },
    {
      title: "Robust Evaluation",
      description: "Comprehensive evaluation metrics to ensure model accuracy is always measurable and transparent (F1, Accuracy, Precision, Recall).",
      icon: Search,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold mb-2">
            Version 1.0.0 (Stable)
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Hybrid Hoax News <br/> Classification System
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl">
            A smart solution for verifying news authenticity through a combined approach of IndoBERT + Graph Neural Network capable of analyzing semantics and propagation mechanisms simultaneously.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck className="w-64 h-64" />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 mb-6 px-1">Feature Highlights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <Card
              key={i}
              className="hover:scale-105 transition-transform duration-300 hover:shadow-lg border-transparent"
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
