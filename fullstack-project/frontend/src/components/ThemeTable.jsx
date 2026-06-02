export default function ThemeTable({ columns = [], data = [] }) {
  return (
    <div className="overflow-auto rounded-2xl border border-theme bg-surface">
      <table className="min-w-full divide-y divide-theme">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-sm font-semibold text-muted">{col.title}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-theme">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-card transition">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-theme">{row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
