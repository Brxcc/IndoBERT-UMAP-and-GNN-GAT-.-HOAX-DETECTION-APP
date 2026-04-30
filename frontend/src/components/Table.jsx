export function Table({ items, columns, emptyMsg }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-sm">
        {emptyMsg || "No data available."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="px-6 py-4 font-semibold text-slate-600">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item, rowIndex) => (
            <tr key={item.id || rowIndex} className="hover:bg-slate-50/50 transition-colors">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className="px-6 py-4 text-slate-700">
                  {col.cell ? col.cell(item, rowIndex) : item[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
