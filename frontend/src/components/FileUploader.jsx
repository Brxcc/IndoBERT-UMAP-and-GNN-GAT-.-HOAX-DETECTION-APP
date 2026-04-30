import { UploadCloud } from "lucide-react";

export function FileUploader({ file, onFileSelect }) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      className="border-2 border-dashed border-blue-200 rounded-3xl p-12 text-center bg-blue-50/30 hover:bg-blue-50/60 transition-colors cursor-pointer group"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById("file-upload").click()}
    >
      <input
        id="file-upload"
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
      <div className="mx-auto w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform mb-6">
        <UploadCloud className="w-10 h-10 text-blue-500" />
      </div>
      <h4 className="text-xl font-semibold text-slate-800 mb-2">
        {file ? file.name : "Upload dataset CSV"}
      </h4>
      <p className="text-slate-500 max-w-sm mx-auto">
        Drag and drop files here, or click to select a file from your computer (Max: 50MB)
      </p>
    </div>
  );
}
