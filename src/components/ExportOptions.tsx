import React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download as DownloadIcon } from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF } from "../exportUtils";
import { cn } from "@/lib/utils";

interface ExportOptionsProps {
  data: any[];
  filename: string;
  pdfColumns?: { header: string; dataKey: string }[];
  pdfTitle?: string;
  title?: string;
}

export function ExportOptions({ data, filename, pdfColumns, pdfTitle, title = "Export" }: ExportOptionsProps) {
  const handleCSV = () => exportToCSV(data, filename);
  const handleExcel = () => exportToExcel(data, filename);
  const handlePDF = () => {
    // Basic automatic columns generation if none provided
    let columnsToUse = pdfColumns;
    if (!columnsToUse && data.length > 0) {
      columnsToUse = Object.keys(data[0]).map(k => ({ header: k.toUpperCase(), dataKey: k }));
    }
    exportToPDF(data, columnsToUse || [], filename, pdfTitle || filename);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8")}>
        <DownloadIcon className="w-4 h-4 mr-2" />
        {title}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExcel}>Download Excel (.xlsx)</DropdownMenuItem>
        <DropdownMenuItem onClick={handleCSV}>Download CSV (.csv)</DropdownMenuItem>
        <DropdownMenuItem onClick={handlePDF}>Download PDF (.pdf)</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
