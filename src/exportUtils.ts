import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // Add serial number mapping
  const mappedData = data.map((item, index) => ({
    "Sl No": index + 1,
    ...item
  }));
  
  const headers = Object.keys(mappedData[0]);
  const csvRows = [];
  csvRows.push(headers.join(","));

  for (const row of mappedData) {
    const values = headers.map(header => {
      const val = row[header];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.click();
};

export const exportToExcel = (data: any[], filename: string) => {
  if (data.length === 0) return;
  
  // Add serial number mapping
  const mappedData = data.map((item, index) => ({
    "Sl No": index + 1,
    ...item
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(mappedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const exportToPDF = (data: any[], columns: { header: string; dataKey: string }[], filename: string, title?: string) => {
  if (data.length === 0) return;
  
  // Always include Serial Number for compliance with user requests
  const finalColumns = [
    { header: "SL", dataKey: "sl_no" },
    ...columns
  ];
  
  const finalData = data.map((item, index) => ({
    ...item,
    sl_no: index + 1
  }));

  // Detect orientation: if more than 7 columns (including SL), use landscape
  const orientation = finalColumns.length > 7 ? 'l' : 'p';
  const doc = new jsPDF({ orientation });
  
  if (title) {
    doc.setFontSize(14);
    doc.text(title, 14, 15);
  }
  
  autoTable(doc, {
    head: [finalColumns.map(col => col.header)],
    body: finalData.map(item => finalColumns.map(col => {
      const val = item[col.dataKey];
      return val !== undefined && val !== null ? String(val) : "";
    })),
    startY: title ? 22 : 10,
    theme: 'grid',
    styles: { 
      fontSize: orientation === 'l' ? 7 : 8, 
      cellPadding: 2,
      font: "helvetica"
    },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  doc.save(`${filename}.pdf`);
};
