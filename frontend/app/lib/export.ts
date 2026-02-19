export function exportToCSV<T>(
  data: T[],
  columns: { header: string; accessor: (item: T) => string | number }[],
  filename: string,
) {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar.");
    return;
  }

  const headers = columns.map((col) => `"${col.header}"`).join(",");

  const rows = data.map((item) => {
    return columns
      .map((col) => {
        let val = col.accessor(item);
        if (typeof val === "string") {
          val = val.replace(/"/g, '""');
          return `"${val}"`;
        }
        return val;
      })
      .join(",");
  });

  const csvContent = "\uFEFF" + [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `${filename}_${new Date().toISOString().split("T")[0]}.csv`,
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
