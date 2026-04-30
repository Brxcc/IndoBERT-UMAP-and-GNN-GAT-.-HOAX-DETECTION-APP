import { Table } from "../components/Table";
import { Database, Filter, Search } from "lucide-react";
import { cn } from "../lib/utils";
import { useState } from "react";

const mockDatasets = [
  { id: 1, text: "Ujian Nasional akan dihapus tahun depan dan diganti sistem poin murni dari guru.", label: "Hoaks" },
  { id: 2, text: "Kementerian Pendidikan menegaskan tidak ada penghapusan tunjangan profesi guru.", label: "Fakta" },
  { id: 3, text: "Beredar pesan suara yang menyebut vaksinasi jadi syarat mutlak ambil rapor siswa.", label: "Hoaks" },
  { id: 4, text: "Mendikbudristek tetapkan aturan seragam baju adat untuk hari-hari tertentu.", label: "Fakta" },
  { id: 5, text: "Sekolah gratis di semua jenjang swasta akan diberlakukan mulai bulan juli.", label: "Hoaks" },
  { id: 6, text: "Bantuan kuota internet gratis bagi pelajar akan dilanjutkan semester ini.", label: "Fakta" },
];

export function DatasetsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredData = mockDatasets.filter(
    d => d.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { header: "ID", accessor: "id" },
    { 
      header: "Teks Dokumen", 
      accessor: "text",
      cell: (item) => <div className="max-w-2xl text-slate-600 truncate">{item.text}</div>
    },
    { 
      header: "Label (Ground Truth)", 
      accessor: "label",
      cell: (item) => (
        <span className={cn(
          "px-3 py-1 rounded-full text-xs font-semibold",
          item.label === "Hoaks" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
        )}>
          {item.label}
        </span>
      )
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Database className="w-6 h-6 text-blue-600" />
            Manajemen Dataset
          </h2>
          <p className="text-slate-500 mt-1">Kelola dan tinjau data latih maupun data uji untuk evaluasi model.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari teks dataset..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <button className="p-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <Table items={filteredData} columns={columns} />
        
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50">
          <span>Menampilkan {filteredData.length} dari {mockDatasets.length} entri</span>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50" disabled>Sebelumnya</button>
            <button className="px-3 py-1 rounded-md bg-white border border-slate-200">1</button>
            <button className="px-3 py-1 rounded-md hover:bg-slate-200 transition-colors disabled:opacity-50" disabled>Selanjutnya</button>
          </div>
        </div>
      </div>
    </div>
  );
}
