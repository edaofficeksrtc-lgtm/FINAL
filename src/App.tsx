/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bus as BusIcon,
  Users as UsersIcon,
  User as UserIcon,
  ArrowRightLeft as ArrowRightLeftIcon,
  ChevronRight as ChevronRightIcon,
  MapPin as MapPinIcon,
  Search as SearchIcon,
  Trash as TrashIcon,
  Upload as UploadIcon,
  Pencil as PencilIcon,
  Settings as SettingsIcon,
  Folder as FolderIcon,
  Download as DownloadIcon,
  Save as SaveIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  AlertCircle as AlertCircleIcon,
  Check as CheckIcon,
  X as XIcon,
  Clock as ClockIcon,
  ArrowRight as ArrowRightIcon,
  FileText as FileTextIcon,
  Target as TargetIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CategoryManager } from "./components/CategoryManager";
import { ExportOptions } from "./components/ExportOptions";
import { AdminSettings } from "./components/AdminSettings";
import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import autoTable from "jspdf-autotable";

interface Employee {
  id: string;
  penNumber?: string;
  name: string;
  dob?: string;
  category: string;
  currentUnit: string;
  homeUnit: string;
  distanceToHome: number;
  monthsInCurrentUnit: number;
  isEligible?: boolean;
  requiredIncumbencyMonths?: number;
  workingAs?: string;
  leaveReason?: string;
  leaveMonths?: number;
  dateOfEntryInService?: string;
  lightDutyAs?: string;
  isDeleted?: boolean;
  isDeceased?: boolean;
  isBadali?: boolean;
  suspensionReason?: string;
  deputationTo?: string;
  trainingType?: string;
  workArrangementUnit?: string;
  workArrangementFromDate?: string;
  workArrangementToDate?: string;
  workArrangementReason?: string;
  workArrangementOrderNo?: string;
  pendingTransfer?: {
    targetUnit: string;
    oldUnit?: string;
    targetDate?: string;
    reason?: string;
    status?: 'pending' | 'accepted' | 'rejected';
  };
}

interface HistoryEvent {
  id: string;
  employeeId: string;
  penNumber: string;
  eventType: string;
  oldUnit?: string;
  newUnit?: string;
  oldCategory?: string;
  newCategory?: string;
  remarks?: string;
  createdAt: string;
}

interface Unit {
  id: string;
  name: string;
  circleId: string;
  circleName: string;
  isSpecialUnit: boolean;
  sanctionedStrength?: Record<string, number>;
  sanctionedBadaliStrength?: Record<string, number>;
}

const unitPositions: Record<string, number> = {
  "Thiruvananthapuram City": 0,
  "Thiruvananthapuram Central": 5,
  Nedumangad: 20,
  Kollam: 70,
  Ernakulam: 220,
  Munnar: 280,
  Kozhikode: 380,
  Kasaragod: 560,
};

function getMockDistance(unitA: string, unitB: string) {
  if (unitA === unitB) return 0;
  const a = unitPositions[unitA] !== undefined ? unitPositions[unitA] : 0;
  const b = unitPositions[unitB] !== undefined ? unitPositions[unitB] : 0;
  return Math.abs(a - b);
}

function getRetirementDate(
  dob?: string,
  entryAsService?: string,
  isBadali?: boolean,
): Date | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  let retirementAge = 56;
  if (isBadali) {
    retirementAge = 60;
  } else if (entryAsService) {
    const entry = new Date(entryAsService);
    if (!isNaN(entry.getTime())) {
      if (entry >= new Date("2013-04-01")) {
        retirementAge = 60;
      }
    }
  }

  // Retirement is usually end of the month in which they reach retirement age.
  const retireDate = new Date(
    birthDate.getFullYear() + retirementAge,
    birthDate.getMonth(),
    birthDate.getDate(),
  );

  // Adjust to end of month.
  return new Date(retireDate.getFullYear(), retireDate.getMonth() + 1, 0);
}


function EmployeeFilters({
  searchQuery,
  setSearchQuery,
  filterCategory,
  setFilterCategory,
  categories,
  filterUnit,
  setFilterUnit,
  units,
  filterBadaliStatus,
  setFilterBadaliStatus,
}: any) {
  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
      <div className="w-full sm:w-[260px]">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Search Employee
        </label>
        <div className="relative">
          <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search by name or PEN..."
            className="pl-9 w-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <div className="w-full sm:w-[240px]">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Category
        </label>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat: any) => (
              <SelectItem key={cat.id} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-[240px]">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Unit
        </label>
        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Units</SelectItem>
            {units.map((u: any) => (
              <SelectItem key={u.id} value={u.name}>
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-full sm:w-[240px]">
        <label className="text-sm font-medium text-gray-700 block mb-1.5">
          Badali Status
        </label>
        <Select
          value={filterBadaliStatus}
          onValueChange={setFilterBadaliStatus}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filter by Badali Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            <SelectItem value="permanent">Permanent Only</SelectItem>
            <SelectItem value="badali">Badali Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

const downloadCsvTemplate = (filename: string, content: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const handleTransferExportPDF = (data: any[], title: string, filename: string) => {
  const doc = new jsPDF({ orientation: data.length > 0 && Object.keys(data[0]).length > 6 ? 'l' : 'p' }) as any;
  const finalData = data.map((item, index) => ({
    "SL": index + 1,
    ...item
  }));
  const headers = Object.keys(finalData[0] || {}).map(k => k.toUpperCase());
  
  autoTable(doc, {
    head: [headers],
    body: finalData.map(item => Object.values(item).map(v => v !== null && v !== undefined ? String(v) : "")),
    startY: 20,
    theme: 'grid',
    styles: { fontSize: headers.length > 7 ? 6 : 8, cellPadding: 1, font: "helvetica" },
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' }
  });
  doc.save(`${filename}.pdf`);
};

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      return document.documentElement.classList.contains("dark");
    }
    return false;
  });
  const [themeColor, setThemeColor] = useState<string>("default");

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove(
        "theme-rose",
        "theme-ocean",
        "theme-forest",
        "theme-amber",
      );
      if (themeColor !== "default") {
        document.documentElement.classList.add(`theme-${themeColor}`);
      }
    }
  }, [themeColor]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      return next;
    });
  };

  // ==========================================
  // USER SESSIONS & AUTHORIZATION SYSTEM
  // ==========================================
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const userJson = localStorage.getItem("ksrtc_user");
    if (userJson) {
      try {
        return JSON.parse(userJson);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const getAuthHeaders = () => {
    if (!currentUser) return { "Content-Type": "application/json" };
    return {
      "Content-Type": "application/json",
      "X-User-Id": currentUser.id || "",
      "X-User-Username": currentUser.username || ""
    };
  };

  const checkEditPermission = (unitName?: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (!currentUser.canEdit) return false;
    if (!unitName) return false;
    return currentUser.allowedUnits.includes("*") || currentUser.allowedUnits.includes(unitName);
  };

  const checkTransferPermission = (fromUnitName?: string) => {
    if (!currentUser) return false;
    if (currentUser.role === "admin") return true;
    if (!currentUser.canTransfer) return false;
    if (!fromUnitName) return false;
    return currentUser.allowedUnits.includes("*") || currentUser.allowedUnits.includes(fromUnitName);
  };

  const handleLogout = () => {
    localStorage.removeItem("ksrtc_user");
    setCurrentUser(null);
  };

  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("ksrtc_user", JSON.stringify(data.user));
        setCurrentUser(data.user);
        setLoginUsername("");
        setLoginPassword("");
      } else {
        const err = await res.json().catch(() => ({ error: "Authentication failed. Check your credentials." }));
        setLoginError(err.error || "Authentication failed. Check your credentials.");
      }
    } catch (e) {
      setLoginError("Failed to connect to authentication server.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deceasedEmployees, setDeceasedEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [allUnits, setAllUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryGroups, setCategoryGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterUnit, setFilterUnit] = useState<string>("all");
  const [filterEligibility, setFilterEligibility] = useState<string>("all");
  const [filterBadaliStatus, setFilterBadaliStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>("");
  const [reportSearchQuery, setReportSearchQuery] = useState<string>("");
  const [selectedReportEmployee, setSelectedReportEmployee] = useState<Employee | null>(null);
  const [filterTransferDuration, setFilterTransferDuration] =
    useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dashboardFilterUnit, setDashboardFilterUnit] = useState<string>("all");
  const [dashboardSort, setDashboardSort] = useState<{
    key: string;
    dir: "asc" | "desc";
  }>({ key: "Unit Name", dir: "asc" });
  const [strengthTab, setStrengthTab] = useState<"total" | "permanent" | "badali">("total");
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});

  const [collapseOperatingCentres, setCollapseOperatingCentres] = useState<boolean>(false);
  const [groupBy, setGroupBy] = useState<"none" | "district" | "type">("none");
  const [transferSubTab, setTransferSubTab] = useState<"incoming" | "outgoing" | "eligible" | "history">("incoming");

  useEffect(() => {
    if (strengthTab === "total" && filterBadaliStatus !== "all") {
      setFilterBadaliStatus("all");
    } else if (strengthTab === "permanent" && filterBadaliStatus !== "permanent") {
      setFilterBadaliStatus("permanent");
    } else if (strengthTab === "badali" && filterBadaliStatus !== "badali") {
      setFilterBadaliStatus("badali");
    }
  }, [strengthTab]);

  useEffect(() => {
    if (filterBadaliStatus === "all" && strengthTab !== "total") {
      setStrengthTab("total");
    } else if (filterBadaliStatus === "permanent" && strengthTab !== "permanent") {
      setStrengthTab("permanent");
    } else if (filterBadaliStatus === "badali" && strengthTab !== "badali") {
      setStrengthTab("badali");
    }
  }, [filterBadaliStatus]);
  const [tableSorts, setTableSorts] = useState<
    Record<string, { key: string; dir: "asc" | "desc" }>
  >({});

  const handleTableSort = (table: string, key: string) => {
    setTableSorts((prev) => {
      const current = prev[table];
      if (current && current.key === key) {
        return {
          ...prev,
          [table]: { key, dir: current.dir === "asc" ? "desc" : "asc" },
        };
      }
      return { ...prev, [table]: { key, dir: "asc" } };
    });
  };

  const getSortIcon = (table: string, key: string) => {
    const s = tableSorts[table];
    if (s?.key === key) return s.dir === "asc" ? " ↑" : " ↓";
    return "";
  };

  function getSortedData<T = any>(
    data: T[],
    table: string,
    defaultSortKey?: string,
    defaultSortDir: "asc" | "desc" = "asc",
  ): T[] {
    let s = tableSorts[table];
    if (!s && defaultSortKey) s = { key: defaultSortKey, dir: defaultSortDir };
    if (!s) return data;
    return [...data].sort((a: any, b: any) => {
      let valA = a[s!.key];
      let valB = b[s!.key];
      if (valA === null || valA === undefined) valA = "";
      if (valB === null || valB === undefined) valB = "";
      if (typeof valA === "string" && typeof valB === "string") {
        return s!.dir === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else if (typeof valA === "number" && typeof valB === "number") {
        return s!.dir === "asc" ? valA - valB : valB - valA;
      } else if (valA instanceof Date && valB instanceof Date) {
        return s!.dir === "asc"
          ? valA.getTime() - valB.getTime()
          : valB.getTime() - valA.getTime();
      }
      return 0;
    });
  }

  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(
    null,
  );
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState("");
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferringEmployee, setTransferringEmployee] =
    useState<Employee | null>(null);
  const [transferTargetUnit, setTransferTargetUnit] = useState("");
  const [transferTargetDate, setTransferTargetDate] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferError, setTransferError] = useState<string | null>(null);
  const [employeeError, setEmployeeError] = useState<string | null>(null);
  const [isBulkTransferModalOpen, setIsBulkTransferModalOpen] = useState(false);
  const [bulkTransferCsvText, setBulkTransferCsvText] = useState("");
  const [bulkTransferMode, setBulkTransferMode] = useState<"direct" | "unit-accepted">("unit-accepted");
  const [isBulkStrengthModalOpen, setIsBulkStrengthModalOpen] = useState(false);
  const [bulkStrengthCsvText, setBulkStrengthCsvText] = useState("");

  const [isWAModalOpen, setIsWAModalOpen] = useState(false);
  const [waEmployee, setWaEmployee] = useState<Employee | null>(null);
  const [waTargetUnit, setWaTargetUnit] = useState("");
  const [waFromDate, setWaFromDate] = useState("");
  const [waToDate, setWaToDate] = useState("");
  const [waReason, setWaReason] = useState("");
  const [waOrderNo, setWaOrderNo] = useState("");

  const [newEmp, setNewEmp] = useState({
    name: "",
    penNumber: "",
    dob: "",
    category: "",
    currentUnit: "",
    homeUnit: "",
    dateOfEntry: "",
    dateOfEntryInService: "",
    workingAs: "",
    leaveReason: "",
    leaveMonths: 0,
    lightDutyAs: "",
    suspensionReason: "",
    deputationTo: "",
    trainingType: "",
    workArrangementUnit: "",
    workArrangementFromDate: "",
    workArrangementToDate: "",
    workArrangementReason: "",
    workArrangementOrderNo: "",
    isDeceased: false,
  });

  const [activeDrillDown, setActiveDrillDown] = useState<{unitName: string, category: string, employeeIds: string[]} | null>(null);

  const fetchEmployees = async () => {
    try {
      const [empRes, unitRes, allUnitRes, histRes, catRes, decRes] = await Promise.all([
        fetch("/api/employees", { headers: getAuthHeaders() }),
        fetch("/api/units", { headers: getAuthHeaders() }),
        fetch("/api/units?all=true", { headers: getAuthHeaders() }),
        fetch("/api/history", { headers: getAuthHeaders() }),
        fetch("/api/categories", { headers: getAuthHeaders() }),
        fetch("/api/employees/deceased", { headers: getAuthHeaders() }),
      ]);
      const emps = await empRes.json();
      const unts = await unitRes.json();
      const allUnts = await allUnitRes.json();
      const hist = await histRes.json();
      const catData = await catRes.json();
      const decs = await decRes.json();
      setEmployees(emps);
      setUnits(unts);
      setAllUnits(allUnts);
      setHistory(hist);
      setCategories(catData.categories || []);
      setCategoryGroups(catData.groups || []);
      setDeceasedEmployees(decs || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [empRes, unitRes, allUnitRes, histRes, catRes, decRes] = await Promise.all([
          fetch("/api/employees", { headers: getAuthHeaders() }),
          fetch("/api/units", { headers: getAuthHeaders() }),
          fetch("/api/units?all=true", { headers: getAuthHeaders() }),
          fetch("/api/history", { headers: getAuthHeaders() }),
          fetch("/api/categories", { headers: getAuthHeaders() }),
          fetch("/api/employees/deceased", { headers: getAuthHeaders() }),
        ]);
        const emps = await empRes.json();
        const unts = await unitRes.json();
        const allUnts = await allUnitRes.json();
        const hist = await histRes.json();
        const catData = await catRes.json();
        const decs = await decRes.json();
        setEmployees(emps);
        setUnits(unts);
        setAllUnits(allUnts);
        setHistory(hist);
        setCategories(catData.categories || []);
        setCategoryGroups(catData.groups || []);
        setDeceasedEmployees(decs || []);
      } catch (e) {
        console.error("Error fetching data", e);
      } finally {
        setLoading(false);
      }
    }
    if (currentUser) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleCSVFileSelect = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      alert("Invalid file format. Please upload a .csv file.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setter(content);
    };
    reader.onerror = () => {
      alert("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmployeeError(null);
    
    if (!checkEditPermission(newEmp.currentUnit)) {
      setEmployeeError(`Permission Denied: You do not have permissions to add/edit employees under unit "${newEmp.currentUnit}"`);
      return;
    }

    try {
      const url = editingEmployeeId
        ? `/api/employees/${editingEmployeeId}`
        : "/api/employees";
      const method = editingEmployeeId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(newEmp),
      });
      if (res.ok) {
        await fetchEmployees();
        setIsAddEmployeeModalOpen(false);
        setEditingEmployeeId(null);
        setEmployeeError(null);
        setNewEmp({
          name: "",
          penNumber: "",
          dob: "",
          category: "",
          currentUnit: "",
          homeUnit: "",
          dateOfEntry: "",
          dateOfEntryInService: "",
          workingAs: "",
          leaveReason: "",
          leaveMonths: 0,
          lightDutyAs: "",
          suspensionReason: "",
          deputationTo: "",
          trainingType: "",
          workArrangementUnit: "",
          workArrangementFromDate: "",
          workArrangementToDate: "",
          workArrangementReason: "",
          workArrangementOrderNo: "",
          isDeceased: false,
        });
      } else {
        const errJson = await res.json();
        setEmployeeError(errJson.error || "Failed to save employee.");
      }
    } catch (e) {
      console.error(e);
      setEmployeeError("Network error occurred.");
    }
  };

  const handleEditClick = (emp: Employee) => {
    setEmployeeError(null);
    setEditingEmployeeId(emp.id);
    setNewEmp({
      name: emp.name,
      penNumber: emp.penNumber || "",
      dob: emp.dob || "",
      category: emp.category,
      currentUnit: emp.currentUnit,
      homeUnit: emp.homeUnit,
      dateOfEntry: "", // Keep blank if we don't have the original recorded date
      dateOfEntryInService: emp.dateOfEntryInService || "",
      workingAs: emp.workingAs || "",
      leaveReason: emp.leaveReason || "",
      leaveMonths: emp.leaveMonths || 0,
      lightDutyAs: emp.lightDutyAs || "",
      suspensionReason: emp.suspensionReason || "",
      deputationTo: emp.deputationTo || "",
      trainingType: emp.trainingType || "",
      workArrangementUnit: emp.workArrangementUnit || "",
      workArrangementFromDate: emp.workArrangementFromDate || "",
      workArrangementToDate: emp.workArrangementToDate || "",
      workArrangementReason: emp.workArrangementReason || "",
      workArrangementOrderNo: emp.workArrangementOrderNo || "",
      isDeceased: emp.isDeceased || false,
    });
    setIsAddEmployeeModalOpen(true);
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkCsvText.trim()) return;

    const rows = bulkCsvText
      .trim()
      .split("\n")
      .map((r) => r.split(",").map((s) => s.trim()))
      .filter((row) => row.some(cell => cell !== ""));
    if (rows.length < 2) {
      alert("Please provide at least a header row and one data row.");
      return;
    }
    const data = rows.slice(1).map((row) => ({
      penNumber: (row[0] || "").replace(/\s+/g, ""),
      name: row[1],
      category: row[2],
      currentUnit: row[3],
      homeUnit: row[4],
      dateOfEntry: row[5],
      dateOfEntryInService: row[6],
      workingAs: row[7],
      leaveReason: row[8],
      lightDutyAs: row[9],
      leaveMonths: Number(row[10]) || 0,
    }));

    const invalidRows = data.filter((e) => !e.name || !e.penNumber);
    if (invalidRows.length > 0) {
      alert(
        `Validation Error: Found ${invalidRows.length} rows missing required 'Name' or 'PEN Number'. Please check your CSV data.`,
      );
      return;
    }

    // Verify bulk upload edit permissions
    for (const item of data) {
      if (!checkEditPermission(item.currentUnit)) {
        alert(`Permission Denied: You do not have permission to upload employees for unit "${item.currentUnit}".`);
        return;
      }
    }

    try {
      const res = await fetch("/api/employees/bulk", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ employees: data }),
      });
      if (res.ok) {
        await fetchEmployees();
        setIsBulkUploadModalOpen(false);
        setBulkCsvText("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Server failed to process bulk upload.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error during bulk upload.");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    const emp = employees.find((e) => e.id === id);
    if (emp && !checkEditPermission(emp.currentUnit)) {
      alert(`Permission Denied: You do not have permission to delete employees belonging to unit "${emp.currentUnit}".`);
      return;
    }

    if (!confirm("Are you sure you want to delete this employee?")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { 
        method: "DELETE",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchEmployees();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to delete employee.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleManualTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringEmployee || !transferTargetUnit) return;

    if (!transferReason.trim()) {
      setTransferError("Transfer Reason cannot be empty.");
      return;
    }

    if (!checkTransferPermission(transferringEmployee.currentUnit)) {
      alert(`Permission Denied: You do not have permission to initiate transfer from unit "${transferringEmployee.currentUnit}".`);
      return;
    }

    setTransferError(null);
    try {
      const res = await fetch("/api/transfers/apply", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          employeeId: transferringEmployee.id,
          targetUnit: transferTargetUnit,
          targetDate: transferTargetDate,
          reason: transferReason,
        }),
      });
      if (res.ok) {
        setIsTransferModalOpen(false);
        setTransferringEmployee(null);
        setTransferTargetUnit("");
        setTransferTargetDate("");
        setTransferReason("");
        setTransferError(null);
        await fetchEmployees();
      } else {
        const errData = await res.json();
        setTransferError(errData.error || "Failed to submit transfer request.");
      }
    } catch (e) {
      console.error(e);
      setTransferError("An error occurred. Please try again.");
    }
  };

  const handleBulkTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkTransferCsvText.trim()) return;

    const rows = bulkTransferCsvText
      .trim()
      .split("\n")
      .map((r) => r.split(",").map((s) => s.trim()))
      .filter((row) => row.some(cell => cell !== ""));
    if (rows.length < 2) {
      alert("Please provide at least a header row and one data row.");
      return;
    }
    const data = rows.slice(1).map((row) => ({
      penNumber: (row[0] || "").replace(/\s+/g, ""),
      targetUnit: row[1],
      targetDate: row[2],
      reason: row[3] || "Bulk Transfer",
    }));

    const invalidRows = data.filter((t) => !t.penNumber || !t.targetUnit);
    if (invalidRows.length > 0) {
      alert(
        `Validation Error: Found ${invalidRows.length} rows missing required 'PEN Number' or 'Target Unit'. Please fix your CSV data.`,
      );
      return;
    }

    // Client-side bulk transfer checking
    for (const item of data) {
      const emp = employees.find((e) => e.penNumber === item.penNumber);
      if (emp) {
        if (!checkTransferPermission(emp.currentUnit)) {
          alert(`Permission Denied: You do not have transfer permission for employee "${emp.name}" (assigned to unit "${emp.currentUnit}").`);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/transfers/bulk-apply", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ transfers: data, mode: bulkTransferMode }),
      });
      if (res.ok) {
        await fetchEmployees();
        setIsBulkTransferModalOpen(false);
        setBulkTransferCsvText("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Server failed to process bulk transfers.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error during bulk transfer.");
    }
  };

  const handleBulkStrengthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkStrengthCsvText.trim()) return;

    const rows = bulkStrengthCsvText
      .trim()
      .split("\n")
      .map((r) => r.split(",").map((s) => s.trim()))
      .filter((row) => row.some(cell => cell !== ""));
    if (rows.length < 2) {
      alert("Please provide at least a header row and one data row.");
      return;
    }
    const records = [];
    const headers = rows[0].map((h) => h.toLowerCase());
    const unitIdx = headers.findIndex((h) => h.includes("unit"));
    const catIdx = headers.findIndex((h) => h.includes("category"));
    const strIdx = headers.findIndex(
      (h) =>
        (h.includes("perm") && h.includes("strength")) ||
        h === "strength" ||
        h === "perm strength",
    );
    const badaliStrIdx = headers.findIndex(
      (h) =>
        h.includes("badali") && (h.includes("strength") || h.includes("count")),
    );

    if (unitIdx === -1 || catIdx === -1 || strIdx === -1) {
      alert(
        "CSV must contain 'Unit Name', 'Category', and 'Perm Strength' columns in the header. Optional: 'Badali Strength'.",
      );
      return;
    }

    let invalidCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || (row.length === 1 && !row[0])) continue;
      if (!row[unitIdx] || !row[catIdx]) {
        invalidCount++;
        continue;
      }
      records.push({
        unitName: row[unitIdx],
        category: row[catIdx],
        strength: parseInt(row[strIdx], 10) || 0,
        badaliStrength:
          badaliStrIdx !== -1
            ? parseInt(row[badaliStrIdx], 10) || 0
            : undefined,
      });
    }

    if (invalidCount > 0) {
      alert(
        `Validation Error: Skipped ${invalidCount} rows missing 'Unit Name' or 'Category'. Valid records: ${records.length}.`,
      );
      if (records.length === 0) return;
    }

    // Client-side strength update permission checking
    for (const rec of records) {
      if (!checkEditPermission(rec.unitName)) {
        alert(`Permission Denied: You do not have permissions to edit sanctioned strength for "${rec.unitName}".`);
        return;
      }
    }

    try {
      const res = await fetch("/api/units/bulk-strength", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ updates: records }),
      });
      if (res.ok) {
        await fetchEmployees();
        setIsBulkStrengthModalOpen(false);
        setBulkStrengthCsvText("");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Server failed to update bulk strength.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error during bulk strength update.");
    }
  };

  const handleWASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waEmployee || !waTargetUnit) return;

    if (!checkEditPermission(waEmployee.currentUnit)) {
      alert(`Permission Denied: You do not have permissions to modify employees under unit "${waEmployee.currentUnit}".`);
      return;
    }

    try {
      const res = await fetch(
        `/api/employees/${waEmployee.id}/work-arrangement`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            targetUnit: waTargetUnit,
            fromDate: waFromDate,
            toDate: waToDate,
            reason: waReason,
            orderNo: waOrderNo,
          }),
        },
      );
      if (res.ok) {
        setIsWAModalOpen(false);
        setWaEmployee(null);
        setWaTargetUnit("");
        setWaFromDate("");
        setWaToDate("");
        setWaReason("");
        setWaOrderNo("");
        await fetchEmployees();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to submit work arrangement.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const endWorkArrangement = async (id: string) => {
    const emp = employees.find(e => e.id === id);
    if (emp && !checkEditPermission(emp.currentUnit)) {
      alert(`Permission Denied: You do not have permissions to modify employees under unit "${emp.currentUnit}".`);
      return;
    }

    if (!confirm("Are you sure you want to end this work arrangement?")) return;
    try {
      const res = await fetch(`/api/employees/${id}/end-work-arrangement`, {
        method: "POST",
        headers: getAuthHeaders()
      });
      if (res.ok) {
        await fetchEmployees();
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to end work arrangement.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const [singleTransferMode, setSingleTransferMode] = useState<"direct" | "unit-accepted">("unit-accepted");

  const requestTransfer = async (employeeId: string, targetUnit: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp && !checkTransferPermission(emp.currentUnit)) {
      alert(`Permission Denied: You do not have permission to transfer employee from unit "${emp.currentUnit}".`);
      return;
    }

    try {
      const modeToUse = currentUser?.role === "admin" ? singleTransferMode : "unit-accepted";
      const res = await fetch("/api/transfers/apply", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          employeeId, 
          targetUnit, 
          mode: modeToUse,
          reason: transferReason || "Manual Transfer",
          targetDate: transferTargetDate 
        }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const updatedEmpRes = await fetch("/api/employees", { headers: getAuthHeaders() });
        const updatedEmps = await updatedEmpRes.json();
        setEmployees(updatedEmps);
        setIsTransferModalOpen(false);
        setTransferReason("");
        
        if (data.isPending) {
          alert(`Transfer request submitted successfully! Since you are a unit user, the transfer to "${targetUnit}" will remain PENDING until acknowledged/accepted by the "${targetUnit}" depot user.`);
        } else {
          alert("Transfer completed immediately (Administrative override applied).");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to process transfer.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const acceptTransfer = async (employeeId: string) => {
    try {
      const res = await fetch(`/api/transfers/${employeeId}/accept`, {
        method: "POST",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const updatedEmpRes = await fetch("/api/employees", { headers: getAuthHeaders() });
        const updatedEmps = await updatedEmpRes.json();
        setEmployees(updatedEmps);
        alert("Transfer accepted! The employee is now assigned to your unit successfully.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to accept transfer.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const rejectTransfer = async (employeeId: string, cancelReason: string = "") => {
    try {
      const res = await fetch(`/api/transfers/${employeeId}/reject`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: cancelReason }),
      });
      if (res.ok) {
        const updatedEmpRes = await fetch("/api/employees", { headers: getAuthHeaders() });
        const updatedEmps = await updatedEmpRes.json();
        setEmployees(updatedEmps);
        alert("Transfer rejected / cancelled successfully.");
      } else {
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || "Failed to reject transfer.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    const categoryMatch =
      filterCategory === "all" || emp.category === filterCategory;
    const unitMatch = filterUnit === "all" ? 
      (currentUser?.role === "admin" || currentUser?.allowedUnits.includes("*") || (emp.currentUnit && currentUser?.allowedUnits.map(u => u.toLowerCase().trim()).includes(emp.currentUnit.toLowerCase().trim()))) : 
      emp.currentUnit === filterUnit;
    let badaliMatch = true;
    if (filterBadaliStatus === "permanent") badaliMatch = !emp.isBadali;
    if (filterBadaliStatus === "badali") badaliMatch = !!emp.isBadali;

    let eligibilityMatch = true;

    if (filterEligibility !== "all") {
      if (filterEligibility === "home") {
        eligibilityMatch = emp.currentUnit === emp.homeUnit;
      } else if (filterEligibility === "eligible") {
        eligibilityMatch = emp.currentUnit !== emp.homeUnit && !!emp.isEligible;
      } else if (filterEligibility === "pending") {
        eligibilityMatch = emp.currentUnit !== emp.homeUnit && !emp.isEligible;
      }
    }

    const searchMatch =
      searchQuery.trim() === "" ||
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.penNumber &&
        emp.penNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    let durationMatch = true;
    if (filterTransferDuration === "under_6") {
      durationMatch = emp.monthsInCurrentUnit < 6;
    } else if (filterTransferDuration === "over_6") {
      durationMatch = emp.monthsInCurrentUnit >= 6;
    }

    let statusMatch = true;
    if (filterStatus !== "all") {
      if (filterStatus === "active")
        statusMatch =
          !emp.workingAs &&
          !emp.lightDutyAs &&
          !emp.leaveReason &&
          !emp.suspensionReason &&
          !emp.deputationTo &&
          !emp.trainingType &&
          !emp.workArrangementUnit;
      else if (filterStatus === "od") statusMatch = !!emp.workingAs;
      else if (filterStatus === "ld") statusMatch = !!emp.lightDutyAs;
      else if (filterStatus === "leave") statusMatch = !!emp.leaveReason;
      else if (filterStatus === "suspended")
        statusMatch = !!emp.suspensionReason;
      else if (filterStatus === "deputation") statusMatch = !!emp.deputationTo;
      else if (filterStatus === "training") statusMatch = !!emp.trainingType;
      else if (filterStatus === "wa") statusMatch = !!emp.workArrangementUnit;
    }

    return (
      categoryMatch &&
      unitMatch &&
      badaliMatch &&
      eligibilityMatch &&
      searchMatch &&
      durationMatch &&
      statusMatch
    );
  });

  const filteredEmployeesData = filteredEmployees.map((e) => ({
    "PEN Number": e.penNumber,
    Name: e.name,
    Category: e.category,
    "Current Unit": e.currentUnit,
    "Home Unit": e.homeUnit,
    "System Months": e.monthsInCurrentUnit,
    "Date of Entry (Service)": e.dateOfEntryInService || "-",
    "Working As (OD)": e.workingAs || "-",
    "Leave Reason": e.leaveReason || "-",
    "Leave Duration (Months)": e.leaveMonths || 0,
    "Light Duty As": e.lightDutyAs || "-",
    "Suspension Reason": e.suspensionReason || "-",
    "Deputation To": e.deputationTo || "-",
    "Training Type": e.trainingType || "-",
    "Work Arrangement": e.workArrangementUnit
      ? `${e.workArrangementUnit} (${e.workArrangementFromDate} to ${e.workArrangementToDate})`
      : "-",
  }));

  const getUnitDistrict = (u: any) => {
    if (u.district) return u.district;
    const c = (u.circleName || "").trim().toLowerCase();
    if (c.includes("thiruvananthapuram") || c.includes("neyyattinkara") || c.includes("vizhinjam") || c.includes("nedumangad") || c.includes("peroorkada") || c.includes("city")) {
      return "Thiruvananthapuram";
    }
    if (c.includes("kollam")) return "Kollam";
    if (c.includes("munnar") || c.includes("idukki")) return "Idukki";
    if (c.includes("ernakulam") || c.includes("aluva")) return "Ernakulam";
    if (c.includes("kozhikode")) return "Kozhikode";
    if (c.includes("bathery") || c.includes("wayanad") || c.includes("kalpetta")) return "Wayanad";
    if (c.includes("kasaragod")) return "Kasaragod";
    return "Other Districts";
  };

  const getUnitType = (u: any) => {
    if (u.type) return u.type;
    const n = (u.name || "").trim().toLowerCase();
    if (n.includes("workshop")) return "workshop";
    if (n.includes("operating") || n.includes("poovar") || n.includes("vellarada") || n.includes("vellanad") || n.includes("vithura") || n.includes("palode")) {
      return "operating_centre";
    }
    return "depot";
  };

  const getProcessedUnitsAndEmployees = () => {
    if (!collapseOperatingCentres) {
      return { processedUnits: units, processedEmployees: employees.filter(e => !e.isDeleted) };
    }

    // Filter out operating centres that have an associated depot
    const processedUnits = units.filter((u) => getUnitType(u) !== "operating_centre" || !u.associatedDepot);
    
    // For employees, map their current unit to the main associated depot
    const processedEmployees = employees
      .filter(e => !e.isDeleted)
      .map((emp) => {
        let currentUnit = emp.currentUnit;
        let workArrangementUnit = emp.workArrangementUnit;

        const empUnit = units.find((u) => u.name === emp.currentUnit);
        if (empUnit && getUnitType(empUnit) === "operating_centre" && empUnit.associatedDepot) {
          currentUnit = empUnit.associatedDepot;
        }

        if (emp.workArrangementUnit) {
          const waUnit = units.find((u) => u.name === emp.workArrangementUnit);
          if (waUnit && getUnitType(waUnit) === "operating_centre" && waUnit.associatedDepot) {
            workArrangementUnit = waUnit.associatedDepot;
          }
        }

        return {
          ...emp,
          currentUnit,
          workArrangementUnit,
        };
      });

    // Aggregate sanctioned strengths
    const updatedUnits = processedUnits.map((mainUnit) => {
      const subCentres = units.filter(
        (sub) => getUnitType(sub) === "operating_centre" && sub.associatedDepot === mainUnit.name
      );
      if (subCentres.length === 0) return mainUnit;

      const newSanctioned = { ...(mainUnit.sanctionedStrength || {}) };
      const newBadaliSanctioned = { ...(mainUnit.sanctionedBadaliStrength || {}) };

      subCentres.forEach((sub) => {
        if (sub.sanctionedStrength) {
          Object.entries(sub.sanctionedStrength).forEach(([cat, val]) => {
            newSanctioned[cat] = (newSanctioned[cat] || 0) + (val || 0);
          });
        }
        if (sub.sanctionedBadaliStrength) {
          Object.entries(sub.sanctionedBadaliStrength).forEach(([cat, val]) => {
            newBadaliSanctioned[cat] = (newBadaliSanctioned[cat] || 0) + (val || 0);
          });
        }
      });

      return {
        ...mainUnit,
        sanctionedStrength: newSanctioned,
        sanctionedBadaliStrength: newBadaliSanctioned,
      };
    });

    return { processedUnits: updatedUnits, processedEmployees };
  };

  const { processedUnits, processedEmployees } = getProcessedUnitsAndEmployees();

  const dashboardTableDataRaw = processedUnits
    .filter((unit) => filterUnit === "all" || unit.name === filterUnit)
    .filter(
      (unit) =>
        searchQuery.trim() === "" ||
        unit.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .flatMap((unit) => {
      const strengths = unit.sanctionedStrength || {};
      const categoryList = categories.map(c => c.name);

      return categoryList
        .filter(
          (category) => filterCategory === "all" || category === filterCategory,
        )
        .map((category) => {
          const sanctioned = strengths[category] || 0;
          const sanctionedBadali =
            (unit as any).sanctionedBadaliStrength?.[category] || 0;
          
          const getMetricsEmps = (emps: Employee[]) => {
             return emps.filter(e => e.category === category);
          };

          const countMetrics = (emps: Employee[]) => {
            const catEmps = getMetricsEmps(emps);
            const posted = catEmps.filter(
              (e) => e.currentUnit === unit.name,
            ).length;
            const waOut = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.workArrangementUnit,
            ).length;
            const waIn = catEmps.filter(
              (e) => e.workArrangementUnit === unit.name,
            ).length;
            const otherDuty = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.workingAs,
            ).length;
            const lightDuty = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.lightDutyAs,
            ).length;
            const onLeave = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.leaveReason,
            ).length;
            const suspended = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.suspensionReason,
            ).length;
            const deputation = catEmps.filter(
              (e) => e.currentUnit === unit.name && !!e.deputationTo,
            ).length;
            const actual =
              posted +
              waIn -
              waOut -
              otherDuty -
              lightDuty -
              onLeave -
              suspended -
              deputation;
            
            // Collect employee IDs for drill-down
            const drillDownIds = catEmps.filter(e => 
              (e.currentUnit === unit.name && !e.workArrangementUnit && !e.workingAs && !e.lightDutyAs && !e.leaveReason && !e.suspensionReason && !e.deputationTo) ||
              (e.workArrangementUnit === unit.name)
            ).map(e => e.id);

            return {
              posted,
              waIn,
              waOut,
              otherDuty,
              lightDuty,
              onLeave,
              suspended,
              deputation,
              actual,
              drillDownIds
            };
          };

          const totalMetrics = countMetrics(processedEmployees);
          const permMetrics = countMetrics(
            processedEmployees.filter((e) => !e.isBadali),
          );
          const badaliMetrics = countMetrics(
            processedEmployees.filter((e) => !!e.isBadali),
          );

          return {
            id: `${unit.id}-${category}`,
            "Unit Name": unit.name,
            Category: category,
            Sanctioned: sanctioned,
            "Sanctioned (Badali)": sanctionedBadali,
            district: getUnitDistrict(unit),
            type: getUnitType(unit),

            total: totalMetrics,
            perm: permMetrics,
            badali: badaliMetrics,

            "Posted (Total)": totalMetrics.posted,
            "Actual (Perm)": permMetrics.actual,
            "Actual (Badali)": badaliMetrics.actual,
            "WA In": totalMetrics.waIn,
            "WA Out": totalMetrics.waOut,
            "Other Duty": totalMetrics.otherDuty,
            "Light Duty": totalMetrics.lightDuty,
            "On Leave": totalMetrics.onLeave,
            Suspended: totalMetrics.suspended,
            Deputation: totalMetrics.deputation,
            "Actual (Total)": totalMetrics.actual,
            "Excess (Perm)": Math.max(0, permMetrics.actual - sanctioned),
            "Shortage (Perm)": Math.max(0, sanctioned - permMetrics.actual),
            "Excess (Badali)": Math.max(
              0,
              badaliMetrics.actual - sanctionedBadali,
            ),
            "Shortage (Badali)": Math.max(
              0,
              sanctionedBadali - badaliMetrics.actual,
            ),
            "Excess (Total)": Math.max(
              0,
              totalMetrics.actual - (sanctioned + sanctionedBadali),
            ),
            "Shortage (Total)": Math.max(
              0,
              sanctioned + sanctionedBadali - totalMetrics.actual,
            ),
          };
        });
    });

  const dashboardTableDataFiltered = dashboardTableDataRaw.filter((row) => {
    const unitMatch = filterUnit === "all" || row["Unit Name"] === filterUnit;
    const categoryMatch = filterCategory === "all" || row["Category"] === filterCategory;
    return unitMatch && categoryMatch;
  });

  const getDashboardSortValue = (row: any, key: string, tab: "total" | "permanent" | "badali") => {
    if (key === "Unit Name") return row["Unit Name"];
    if (key === "Category") return row["Category"];
    
    const m = tab === "badali" ? row.badali : (tab === "permanent" ? row.perm : row.total);
    const s = tab === "badali" ? row["Sanctioned (Badali)"] : (tab === "permanent" ? row["Sanctioned"] : (row["Sanctioned"] + row["Sanctioned (Badali)"]));
    
    if (key === "Sanctioned") return s;
    if (key === "Posted (Total)") return m.posted;
    if (key === "WA In") return m.waIn;
    if (key === "WA Out") return m.waOut;
    if (key === "Other Duty") return m.otherDuty;
    if (key === "Light Duty") return m.lightDuty;
    if (key === "On Leave") return m.onLeave;
    if (key === "Suspended") return m.suspended;
    if (key === "Deputation") return m.deputation;
    if (key === "Actual") return m.actual;
    if (key === "Excess") return Math.max(0, m.actual - s);
    if (key === "Shortage") return Math.max(0, s - m.actual);
    
    return row[key];
  };

  const dashboardTableData = dashboardTableDataFiltered.sort((a, b) => {
    const valA = getDashboardSortValue(a, dashboardSort.key, strengthTab);
    const valB = getDashboardSortValue(b, dashboardSort.key, strengthTab);
    if (typeof valA === "string" && typeof valB === "string") {
      return dashboardSort.dir === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    } else if (typeof valA === "number" && typeof valB === "number") {
      return dashboardSort.dir === "asc" ? valA - valB : valB - valA;
    }
    return 0;
  });

  const displayActualAcrossAll = dashboardTableData.reduce((acc, unitRow) => {
    const m = strengthTab === "badali" ? unitRow.badali : (strengthTab === "permanent" ? unitRow.perm : unitRow.total);
    return acc + m.posted; 
  }, 0);

  const displaySanctionedAcrossAll = dashboardTableData.reduce((acc, unitRow) => {
    if (strengthTab === "badali") return acc + unitRow["Sanctioned (Badali)"];
    if (strengthTab === "permanent") return acc + unitRow["Sanctioned"];
    return acc + unitRow["Sanctioned"] + unitRow["Sanctioned (Badali)"];
  }, 0);

  const displayWaCount = dashboardTableData.reduce((acc, unitRow) => {
    if (strengthTab === "badali") return acc + unitRow.badali.waIn;
    if (strengthTab === "permanent") return acc + unitRow.permanent.waIn;
    return acc + unitRow.total.waIn;
  }, 0);

  const overallDiff = displayActualAcrossAll - displaySanctionedAcrossAll;

  const handleDashboardSort = (key: string) => {
    if (dashboardSort.key === key) {
      setDashboardSort({
        key,
        dir: dashboardSort.dir === "asc" ? "desc" : "asc",
      });
    } else {
      setDashboardSort({ key, dir: "asc" });
    }
  };

  const eligibleTransfersData = filteredEmployees
    .filter((e) => e.isEligible)
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Current Unit": emp.currentUnit,
      Months: emp.monthsInCurrentUnit,
      "Home Unit": emp.homeUnit,
      "Distance (km)": emp.distanceToHome,
    }));

  const workArrangementsData = filteredEmployees
    .filter((e) => e.workArrangementUnit)
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Origin Unit": emp.currentUnit,
      "WA Unit": emp.workArrangementUnit,
      From: emp.workArrangementFromDate,
      To: emp.workArrangementToDate,
      Reason: emp.workArrangementReason,
      "Order No": emp.workArrangementOrderNo,
    }));

  const lightDutyData = filteredEmployees
    .filter((e) => e.lightDutyAs)
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Current Unit": emp.currentUnit,
      "Light Duty As": emp.lightDutyAs,
    }));

  const otherDutyData = filteredEmployees
    .filter((e) => e.workingAs)
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Current Unit": emp.currentUnit,
      "Working As": emp.workingAs,
    }));

  const badaliData = filteredEmployees
    .filter((e) => e.isBadali)
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Current Unit": emp.currentUnit,
      "Date of Entry in Service": emp.dateOfEntryInService,
      "Date of Entry in Current Unit": emp.dateOfEntry,
    }));

  const expiredWaData = filteredEmployees
    .filter((e) => {
      if (!e.workArrangementUnit || !e.workArrangementToDate) return false;
      const expDate = new Date(e.workArrangementToDate);
      return expDate.getTime() < new Date().getTime();
    })
    .map((emp) => ({
      Employee: `${emp.name} (${emp.penNumber || "N/A"})`,
      Category: emp.category,
      "Origin Unit": emp.currentUnit,
      "WA Unit": emp.workArrangementUnit,
      To: emp.workArrangementToDate,
      Reason: emp.workArrangementReason,
    }));

  const retirementData = employees
    .map((e) => {
      return {
        emp: e,
        date: getRetirementDate(e.dob, e.dateOfEntryInService, e.isBadali),
      };
    })
    .filter((e) => e.date !== null)
    .sort((a, b) => a.date!.getTime() - b.date!.getTime())
    .map(({ emp, date }) => ({
      Name: `${emp.name} (${emp.penNumber || "N/A"})`,
      "PEN Number": emp.penNumber,
      Category: emp.category,
      "Current Unit": emp.currentUnit,
      "Retirement Date": date ? date.toLocaleDateString() : "-",
    }));

  const filteredHistory = history.filter((h) => {
    const empName = employees.find((e) => e.id === h.employeeId)?.name || "";
    const query = auditSearchQuery.trim().toLowerCase();
    if (query === "") return true;

    return (
      empName.toLowerCase().includes(query) ||
      (h.penNumber &&
        h.penNumber.toLowerCase().includes(query)) ||
      (h.remarks &&
        h.remarks.toLowerCase().includes(query)) ||
      (h.eventType &&
        h.eventType.toLowerCase().includes(query))
    );
  });

  const allPendingIncoming = employees.filter((e) => {
    if (!e.pendingTransfer) return false;
    if (currentUser?.role === "admin") return true;
    if (currentUser?.allowedUnits?.includes("*")) return true;
    const cleanTarget = e.pendingTransfer.targetUnit?.toLowerCase()?.trim();
    return currentUser?.allowedUnits
      ?.map((u) => u.toLowerCase().trim())
      ?.includes(cleanTarget);
  });

  const allPendingOutgoing = employees.filter((e) => {
    if (!e.pendingTransfer) return false;
    if (currentUser?.role === "admin") return true;
    if (currentUser?.allowedUnits?.includes("*")) return true;
    const cleanOld = e.pendingTransfer.oldUnit?.toLowerCase()?.trim();
    return currentUser?.allowedUnits
      ?.map((u) => u.toLowerCase().trim())
      ?.includes(cleanOld);
  });

  const historyData = filteredHistory.map((h) => ({
    Date: new Date(h.timestamp).toLocaleString(),
    "Event Type": h.eventType,
    "Employee ID": h.employeeId,
    "PEN Number": h.penNumber,
    Remarks: h.remarks || "-",
  }));

  const unitShortagesData = units
    .filter((u) => filterUnit === "all" || u.name === filterUnit)
    .filter(
      (u) =>
        searchQuery.trim() === "" ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .map((u) => {
      let totalS = 0;
      let totalA = 0;
      Object.keys(u.sanctionedStrength || {})
        .filter((c) => filterCategory === "all" || c === filterCategory)
        .forEach((c) => {
          totalS += (u.sanctionedStrength || {})[c];
          totalA += employees.filter(
            (e) => e.currentUnit === u.name && e.category === c,
          ).length;
        });
      return {
        "Unit Name": u.name,
        Sanctioned: totalS,
        Actual: totalA,
        Difference: totalA - totalS,
      };
    });

  const categoryVacancyData = categories
    .filter((c) => filterCategory === "all" || c.name === filterCategory)
    .filter(
      (c) =>
        searchQuery.trim() === "" ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .map((c) => {
      let totalS = 0;
      units.forEach((u) => {
        if (u.sanctionedStrength?.[c.name])
          totalS += u.sanctionedStrength[c.name];
      });
      const totalA = employees.filter((e) => e.category === c.name).length;
      return {
        Category: c.name,
        Sanctioned: totalS,
        Actual: totalA,
        Difference: totalA - totalS,
      };
    });

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white border border-blue-100 rounded-3xl shadow-[0_20px_50px_rgba(30,58,138,0.08)] overflow-hidden">
          <div className="p-10 pb-6 text-center space-y-3">
            <div className="inline-flex p-4 bg-blue-600 border-4 border-white shadow-md text-white rounded-2xl mb-2 rotate-3">
              <BusIcon className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-blue-900 font-sans uppercase">
              KSRTC <span className="text-blue-600 font-light">Hub</span>
            </h1>
            <p className="text-blue-700/70 text-sm font-medium">
              Centralized Transfer & Strength Management
            </p>
            <p className="text-blue-400 text-[10px] font-bold uppercase tracking-[0.2em] pt-1">
              Developed by Midhun Maheswar M D
            </p>
          </div>

          <Tabs defaultValue="admin" className="w-full px-10 pb-10">
            <TabsList className="grid w-full grid-cols-2 bg-blue-50/50 border border-blue-100 h-12 p-1.5 mb-8 rounded-xl">
              <TabsTrigger 
                value="admin" 
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest transition-all rounded-lg"
              >
                ADMIN
              </TabsTrigger>
              <TabsTrigger 
                value="unit" 
                className="data-[state=active]:bg-white data-[state=active]:text-blue-900 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm rounded-lg"
              >
                UNIT LOGIN
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-5 pt-0 outline-none">
              <div className="bg-blue-50/80 border border-blue-100/50 p-4 rounded-xl mb-4 text-[11px] text-blue-900/70 leading-relaxed font-semibold italic text-center">
                 "Full administrative authorization required for policy overrides and universal audits."
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-rose-600 text-xs text-center font-bold">
                    {loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-800/60 block uppercase tracking-widest ml-1">Admin Identity</label>
                  <Input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="Username"
                    className="bg-blue-50/30 border-blue-100 text-blue-900 placeholder-blue-300 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-800/60 block uppercase tracking-widest ml-1">Secret Key</label>
                  <Input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-blue-50/30 border-blue-100 text-blue-900 placeholder-blue-300 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all px-4"
                  />
                </div>
                <Button type="submit" disabled={isLoggingIn} className="w-full bg-blue-900 text-white font-black uppercase text-xs h-14 rounded-xl hover:bg-blue-800 shadow-xl shadow-blue-900/10 transition-all group">
                  {isLoggingIn ? "VERIFYING CREDENTIALS..." : (
                    <span className="flex items-center gap-2">
                      Initialize Console <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="unit" className="space-y-5 pt-0 outline-none">
              <div className="bg-blue-50 border border-blue-100/50 p-4 rounded-xl mb-4 text-[11px] text-blue-700 leading-relaxed font-semibold italic text-center">
                 "Operational access for Unit Clerks and Depot Managers only."
              </div>
              <form onSubmit={handleLoginSubmit} className="space-y-5">
                {loginError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-rose-600 text-xs text-center font-bold">
                    {loginError}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-800/60 block uppercase tracking-widest ml-1">Terminal ID</label>
                  <Input
                    type="text"
                    required
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder="ADOOR_DEPOT_01"
                    className="bg-blue-50/30 border-blue-100 text-blue-900 placeholder-blue-300 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all px-4"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-blue-800/60 block uppercase tracking-widest ml-1">Access Token</label>
                  <Input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-blue-50/30 border-blue-100 text-blue-900 placeholder-blue-300 h-12 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all px-4"
                  />
                </div>
                
                <Button type="submit" disabled={isLoggingIn} className="w-full bg-blue-900 text-white font-black uppercase text-xs h-14 rounded-xl hover:bg-blue-800 shadow-xl shadow-blue-900/10 transition-all group">
                  {isLoggingIn ? "VERIFYING..." : (
                    <span className="flex items-center gap-2">
                      Authorize Access <ChevronRightIcon className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="bg-blue-50/50 p-5 border-t border-blue-100 text-center">
            <span className="text-blue-400 text-[9px] font-mono leading-relaxed opacity-60">
              System Instance: CLOUD-KSRTC-DB-SNAPSHOT-2026
            </span>
          </div>
        </div>

        <div className="mt-8 text-center space-y-2 font-sans">
          <p className="text-[10px] text-blue-900/40 leading-relaxed font-bold uppercase tracking-[0.2em]">
            STATE TRANSPORT DEPARTMENT • ANALYTICS FRAMEWORK
          </p>
          <div className="flex flex-col items-center gap-2">
            <a
              href="tel:+919995215417"
              className="text-[11px] text-blue-700 hover:text-blue-900 transition-all inline-flex items-center gap-2 font-bold bg-white border border-blue-100 rounded-full px-4 py-1.5 shadow-sm"
            >
              ☎️ Support Desk: +91 9995 215 417
            </a>
            <p className="text-[10px] text-blue-900/60 font-medium">
              Developed by <span className="text-blue-900 font-bold">Midhun Maheswar M D</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BusIcon className="w-8 h-8" />
            <h1 className="text-xl font-bold tracking-tight">
              KSRTC Transfer & Strength Hub
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm opacity-80 hidden md:block">
              Kerala State Road Transport Corporation
            </div>

            <div className="flex items-center gap-2">
              <Select value={themeColor} onValueChange={setThemeColor}>
                <SelectTrigger className="w-[120px] h-8 bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                  <SelectValue placeholder="Theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Slate (Default)</SelectItem>
                  <SelectItem value="rose">Rose</SelectItem>
                  <SelectItem value="ocean">Ocean</SelectItem>
                  <SelectItem value="forest">Forest</SelectItem>
                  <SelectItem value="amber">Amber</SelectItem>
                </SelectContent>
              </Select>

              {currentUser && (
                <div className="flex items-center gap-2 mr-2 bg-primary-foreground/10 px-3 py-1.5 rounded-lg border border-primary-foreground/10 text-xs">
                  <span className="font-semibold">{currentUser.username}</span>
                  <Badge className="bg-amber-400 text-slate-950 hover:bg-amber-400 py-0 text-[10px] uppercase font-bold scale-90">
                    {currentUser.role}
                  </Badge>
                  <button
                    onClick={handleLogout}
                    className="ml-1 text-red-300 hover:text-red-200 font-semibold cursor-pointer text-[11px] hover:underline"
                  >
                    Logout
                  </button>
                </div>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="hover:bg-primary-foreground/20 text-primary-foreground"
              >
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 animate-pulse">
              Loading corporate data...
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6 pb-2">
                <EmployeeFilters
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filterCategory={filterCategory}
                  setFilterCategory={setFilterCategory}
                  filterUnit={filterUnit}
                  setFilterUnit={setFilterUnit}
                  categories={categories}
                  units={units}
                  filterBadaliStatus={filterBadaliStatus}
                  setFilterBadaliStatus={setFilterBadaliStatus}
                />
              </CardContent>
            </Card>

            <Tabs defaultValue="dashboard" className="space-y-6">
              <TabsList className="flex flex-wrap w-full gap-2 p-1 lg:w-full bg-muted/50 rounded-lg">
                <TabsTrigger value="dashboard">
                  <UsersIcon className="w-4 h-4 mr-2" /> Strength
                </TabsTrigger>
                <TabsTrigger value="employees">
                  <UserIcon className="w-4 h-4 mr-2" /> Employees
                </TabsTrigger>
                <TabsTrigger value="categories">
                  <FolderIcon className="w-4 h-4 mr-2" /> Categories
                </TabsTrigger>
                <TabsTrigger value="transfers" className="relative flex items-center">
                  <ArrowRightLeftIcon className="w-4 h-4 mr-2" />
                  Transfers
                  {allPendingIncoming.length > 0 || allPendingOutgoing.length > 0 ? (
                    <span className="ml-1.5 flex items-center gap-1 shrink-0">
                      {allPendingIncoming.length > 0 && (
                        <span className="bg-rose-500 text-white font-semibold font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none" title="Incoming Pending">
                          {allPendingIncoming.length}
                        </span>
                      )}
                      {allPendingOutgoing.length > 0 && (
                        <span className="bg-sky-600 text-white font-semibold font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none" title="Outgoing Pending">
                          {allPendingOutgoing.length}
                        </span>
                      )}
                    </span>
                  ) : null}
                </TabsTrigger>
                <TabsTrigger value="work-arrangements">
                  <UsersIcon className="w-4 h-4 mr-2" /> WA
                </TabsTrigger>
                <TabsTrigger value="light-duty">
                  <UsersIcon className="w-4 h-4 mr-2" /> Light Duty
                </TabsTrigger>
                <TabsTrigger value="other-duty">
                  <UsersIcon className="w-4 h-4 mr-2" /> Other Duty
                </TabsTrigger>
                <TabsTrigger value="badali">
                  <UsersIcon className="w-4 h-4 mr-2" /> Badali
                </TabsTrigger>
                <TabsTrigger value="deceased">
                  <UsersIcon className="w-4 h-4 mr-2" /> Deceased
                </TabsTrigger>
                <TabsTrigger value="analytics">
                  <UsersIcon className="w-4 h-4 mr-2" /> Analytics
                </TabsTrigger>
                <TabsTrigger value="retirement">
                  <UsersIcon className="w-4 h-4 mr-2" /> Retirement
                </TabsTrigger>
                <TabsTrigger value="history">
                  <ArrowRightLeftIcon className="w-4 h-4 mr-2" /> Audit
                </TabsTrigger>
                <TabsTrigger value="reports" className="relative flex items-center">
                  <FileTextIcon className="w-4 h-4 mr-2 text-violet-500" /> Reports
                </TabsTrigger>
                {currentUser?.role === "admin" && (
                  <TabsTrigger value="admin-settings" className="border border-amber-500/10 hover:bg-amber-500/5">
                    <SettingsIcon className="w-4 h-4 mr-2 text-amber-500" /> Admin Settings
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="dashboard" className="space-y-4">
                <Tabs value={strengthTab} onValueChange={(v: any) => setStrengthTab(v)} className="space-y-4">
                  <TabsList className="bg-muted lg:w-[400px] rounded-lg p-1">
                    <TabsTrigger className="flex-1" value="total">Total Strength</TabsTrigger>
                    <TabsTrigger className="flex-1" value="permanent">Permanent Staff</TabsTrigger>
                    <TabsTrigger className="flex-1" value="badali">Badali Staff</TabsTrigger>
                  </TabsList>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                          {strengthTab === "badali" ? "Total Badali Staff" : strengthTab === "permanent" ? "Total Permanent Staff" : "Total Staff Count"}
                        </CardTitle>
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {displayActualAcrossAll}
                        </div>
                        <p className="text-xs text-gray-500">In database</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                          Total Sanctioned {strengthTab !== "total" ? `(${strengthTab === "permanent" ? "Perm" : "Badali"})` : ""}
                        </CardTitle>
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {displaySanctionedAcrossAll}
                        </div>
                        <p className="text-xs text-gray-500">Across all units</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                          Sanctioned vs Actual
                        </CardTitle>
                        <ArrowRightLeftIcon className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div
                          className={`text-2xl font-bold ${overallDiff > 0 ? "text-red-600" : overallDiff < 0 ? "text-orange-600" : ""}`}
                        >
                          {overallDiff > 0
                            ? `+${overallDiff} (Excess)`
                            : overallDiff < 0
                              ? `${Math.abs(overallDiff)} (Shortage)`
                              : "Balanced"}
                        </div>
                        <p className="text-xs text-gray-500">Difference</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">
                          On Work Arrangement
                        </CardTitle>
                        <MapPinIcon className="w-4 h-4 text-gray-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{displayWaCount}</div>
                        <p className="text-xs text-gray-500">Active</p>
                      </CardContent>
                    </Card>
                  </div>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Unit Strength Analysis</CardTitle>
                      <CardDescription>
                        View employee distribution per unit vs sanctioned
                        strength by category. Use Keyboard Arrow Keys (⇅ / ⇄) on the table after clicking to scroll smoothly.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <ExportOptions
                        title="Export Unit Strength"
                        data={dashboardTableData}
                        filename="unit_strength_analysis"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkStrengthModalOpen(true)}
                      >
                        <UploadIcon className="w-4 h-4 mr-2" /> Bulk Upload
                        Strength
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="flex flex-wrap gap-4 items-center bg-amber-50/30 border-b border-gray-100 p-4 font-sans text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-900 flex items-center gap-1">📂 Grouping:</span>
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                          value={groupBy}
                          onChange={(e) => setGroupBy(e.target.value as any)}
                        >
                          <option value="none">No Grouping (Flat list)</option>
                          <option value="district">Group by Districts (Districts & Workshops)</option>
                          <option value="type">Group by Unit Type (Depots, Workshops, Op Centres)</option>
                        </select>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 select-none bg-white py-1 px-3.5 border border-amber-200/50 rounded-md shadow-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                          checked={groupBy === "district"}
                          onChange={(e) => setGroupBy(e.target.checked ? "district" : "none")}
                        />
                        🗺️ Group by District
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-900 select-none bg-white py-1 px-3.5 border border-amber-200/50 rounded-md shadow-sm">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-amber-500 focus:ring-amber-500 h-4 w-4"
                          checked={collapseOperatingCentres}
                          onChange={(e) => setCollapseOperatingCentres(e.target.checked)}
                        />
                        🔗 Combine Operating Centres with Associated Main Depots
                      </label>
                    </div>

                    <div 
                      className="overflow-auto max-h-[600px] border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500/50 m-4 bg-white"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        const target = e.currentTarget;
                        const scrollSpeed = 60; // scroll speed in pixels
                        if (e.key === "ArrowUp") {
                          target.scrollTop -= scrollSpeed;
                          e.preventDefault();
                        } else if (e.key === "ArrowDown") {
                          target.scrollTop += scrollSpeed;
                          e.preventDefault();
                        } else if (e.key === "ArrowLeft") {
                          target.scrollLeft -= scrollSpeed;
                          e.preventDefault();
                        } else if (e.key === "ArrowRight") {
                          target.scrollLeft += scrollSpeed;
                          e.preventDefault();
                        }
                      }}
                    >
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="bg-white sticky left-0 z-10 w-[48px] shadow-[1px_0_0_#e2e8f0]">No.</TableHead>
                          <TableHead
                            className="bg-white sticky left-[48px] z-10 cursor-pointer hover:bg-gray-50 transition-colors shadow-[1px_0_0_#e2e8f0]"
                            style={{ minWidth: '200px' }}
                            onClick={() => handleDashboardSort("Unit Name")}
                          >
                            Unit Name{" "}
                            {dashboardSort.key === "Unit Name" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Category")}
                          >
                            Category{" "}
                            {dashboardSort.key === "Category" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Sanctioned")}
                          >
                            Sanctioned{" "}
                            {dashboardSort.key === "Sanctioned" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Posted (Total)")}
                          >
                            Posted{" "}
                            {dashboardSort.key === "Posted (Total)" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right text-indigo-600 cursor-pointer hover:bg-indigo-50 transition-colors"
                            onClick={() => handleDashboardSort("WA In")}
                          >
                            WA In{" "}
                            {dashboardSort.key === "WA In" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right text-indigo-600 cursor-pointer hover:bg-indigo-50 transition-colors"
                            onClick={() => handleDashboardSort("WA Out")}
                          >
                            WA Out{" "}
                            {dashboardSort.key === "WA Out" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Other Duty")}
                          >
                            Other Duty{" "}
                            {dashboardSort.key === "Other Duty" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Light Duty")}
                          >
                            Light Duty{" "}
                            {dashboardSort.key === "Light Duty" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("On Leave")}
                          >
                            On Leave{" "}
                            {dashboardSort.key === "On Leave" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Suspended")}
                          >
                            Suspended{" "}
                            {dashboardSort.key === "Suspended" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Deputation")}
                          >
                            Deputation{" "}
                            {dashboardSort.key === "Deputation" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right font-bold cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Actual")}
                          >
                            Actual{" "}
                            {dashboardSort.key === "Actual" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right text-gray-600 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleDashboardSort("Excess")}
                          >
                            Excess{" "}
                            {dashboardSort.key === "Excess" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                          <TableHead
                            className="text-right text-orange-600 cursor-pointer hover:bg-orange-50 transition-colors"
                            onClick={() =>
                              handleDashboardSort("Shortage")
                            }
                          >
                            Shortage{" "}
                            {dashboardSort.key === "Shortage" &&
                              (dashboardSort.dir === "asc" ? "↑" : "↓")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          if (groupBy === "none") {
                            return dashboardTableData.map((data, idx) => {
                              const m = strengthTab === "badali" ? data.badali : (strengthTab === "permanent" ? data.perm : data.total);
                              const s = strengthTab === "badali" ? data["Sanctioned (Badali)"] : (strengthTab === "permanent" ? data["Sanctioned"] : data["Sanctioned"] + data["Sanctioned (Badali)"]);
                              const actual = m.actual;
                              const excess = Math.max(0, actual - s);
                              const shortage = Math.max(0, s - actual);
                              return (
                                <TableRow key={data.id}>
                                  <TableCell className="bg-white sticky left-0 z-10 text-gray-500 font-mono text-xs shadow-[1px_0_0_#e2e8f0]">
                                    {idx + 1}
                                  </TableCell>
                                  <TableCell className="bg-white sticky left-[48px] z-10 font-medium whitespace-nowrap shadow-[1px_0_0_#e2e8f0]">
                                    <span className="flex items-center gap-1.5">
                                      {data["Unit Name"]}
                                      {data.type === "workshop" && <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 text-[10px] scale-90 border-none">Workshop</Badge>}
                                      {data.type === "operating_centre" && <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] scale-90 border-none">Sub Op Centre</Badge>}
                                    </span>
                                  </TableCell>
                                  <TableCell className="whitespace-nowrap">{data["Category"]}</TableCell>
                                  <TableCell className="text-right">{s > 0 ? s : "-"}</TableCell>
                                  <TableCell className="text-right">{m.posted > 0 ? m.posted : "-"}</TableCell>
                                  <TableCell className="text-right text-indigo-600">{m.waIn > 0 ? `+${m.waIn}` : "-"}</TableCell>
                                  <TableCell className="text-right text-indigo-600">{m.waOut > 0 ? `-${m.waOut}` : "-"}</TableCell>
                                  <TableCell className="text-right">{m.otherDuty > 0 ? m.otherDuty : "-"}</TableCell>
                                  <TableCell className="text-right">{m.lightDuty > 0 ? m.lightDuty : "-"}</TableCell>
                                  <TableCell className="text-right">{m.onLeave > 0 ? m.onLeave : "-"}</TableCell>
                                  <TableCell className="text-right">{m.suspended > 0 ? m.suspended : "-"}</TableCell>
                                  <TableCell className="text-right">{m.deputation > 0 ? m.deputation : "-"}</TableCell>
                                  <TableCell className="text-right font-bold">
                                    {actual > 0 ? (
                                      <button 
                                        onClick={() => setActiveDrillDown({ unitName: data["Unit Name"], category: data["Category"], employeeIds: m.drillDownIds })}
                                        className="hover:underline text-amber-700 decoration-amber-300 font-bold"
                                      >
                                        {actual}
                                      </button>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell className={`text-right font-bold ${excess > 0 ? "text-red-600 bg-red-50/20" : "text-gray-650"}`}>{excess > 0 ? `+${excess}` : "-"}</TableCell>
                                  <TableCell className={`text-right font-bold ${shortage > 0 ? "text-orange-600 bg-orange-50/20" : ""}`}>{shortage > 0 ? `-${shortage}` : "-"}</TableCell>
                                </TableRow>
                              );
                            });
                          }

                          // Grouped display
                          const groups: Record<string, any[]> = {};
                          dashboardTableData.forEach((row) => {
                            const key = groupBy === "district" ? row.district : (row.type === "workshop" ? "ℹ️ Workshops" : row.type === "operating_centre" ? "🔗 Operating Centres" : "🏢 Main Depots");
                            if (!groups[key]) groups[key] = [];
                            groups[key].push(row);
                          });

                          return Object.entries(groups).map(([groupTitle, groupRows]) => (
                            <React.Fragment key={groupTitle}>
                              <TableRow className="bg-slate-50 border-y border-slate-150 hover:bg-slate-100 font-bold">
                                <TableCell colSpan={15} className="py-2 px-4 text-slate-800 text-xs tracking-wider">
                                  {groupTitle} ({groupRows.length} Categories)
                                </TableCell>
                              </TableRow>
                              {groupRows.map((data, idx) => {
                                const m = strengthTab === "badali" ? data.badali : (strengthTab === "permanent" ? data.perm : data.total);
                                const s = strengthTab === "badali" ? data["Sanctioned (Badali)"] : (strengthTab === "permanent" ? data["Sanctioned"] : data["Sanctioned"] + data["Sanctioned (Badali)"]);
                                const actual = m.actual;
                                const excess = Math.max(0, actual - s);
                                const shortage = Math.max(0, s - actual);
                                return (
                                  <TableRow key={data.id} className="hover:bg-slate-50/40">
                                    <TableCell className="bg-white text-gray-500 font-mono text-xs">
                                      {idx + 1}
                                    </TableCell>
                                    <TableCell className="bg-white font-medium whitespace-nowrap">
                                      <span className="flex items-center gap-1.5">
                                        {data["Unit Name"]}
                                        {data.type === "workshop" && <Badge className="bg-indigo-50 text-indigo-700 hover:bg-slate-100 text-[10px] scale-90 border-none">Workshop</Badge>}
                                        {data.type === "operating_centre" && <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 text-[10px] scale-90 border-none">Sub Op Centre</Badge>}
                                      </span>
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{data["Category"]}</TableCell>
                                    <TableCell className="text-right">{s > 0 ? s : "-"}</TableCell>
                                    <TableCell className="text-right">{m.posted > 0 ? m.posted : "-"}</TableCell>
                                    <TableCell className="text-right text-indigo-600">{m.waIn > 0 ? `+${m.waIn}` : "-"}</TableCell>
                                    <TableCell className="text-right text-indigo-600">{m.waOut > 0 ? `-${m.waOut}` : "-"}</TableCell>
                                    <TableCell className="text-right">{m.otherDuty > 0 ? m.otherDuty : "-"}</TableCell>
                                    <TableCell className="text-right">{m.lightDuty > 0 ? m.lightDuty : "-"}</TableCell>
                                    <TableCell className="text-right">{m.onLeave > 0 ? m.onLeave : "-"}</TableCell>
                                    <TableCell className="text-right">{m.suspended > 0 ? m.suspended : "-"}</TableCell>
                                    <TableCell className="text-right">{m.deputation > 0 ? m.deputation : "-"}</TableCell>
                                    <TableCell className="text-right font-bold">
                                      {actual > 0 ? (
                                        <button 
                                          onClick={() => setActiveDrillDown({ unitName: data["Unit Name"], category: data["Category"], employeeIds: m.drillDownIds })}
                                          className="hover:underline text-amber-700 decoration-amber-300 font-bold"
                                        >
                                          {actual}
                                        </button>
                                      ) : "-"}
                                    </TableCell>
                                    <TableCell className={`text-right font-bold ${excess > 0 ? "text-red-600 bg-red-50/20" : "text-gray-600"}`}>{excess > 0 ? `+${excess}` : "-"}</TableCell>
                                    <TableCell className={`text-right font-bold ${shortage > 0 ? "text-orange-600 bg-orange-50/20" : ""}`}>{shortage > 0 ? `-${shortage}` : "-"}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </React.Fragment>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                    </div>
                  </CardContent>
                </Card>
                </Tabs>
              </TabsContent>

              <TabsContent value="employees">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Employee Master List</CardTitle>
                      <CardDescription>
                        View all staff and their incumbency status.
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <ExportOptions
                        data={filteredEmployeesData}
                        filename="employees_master_list"
                        title="Export Employees"
                      />
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkUploadModalOpen(true)}
                      >
                        <UploadIcon className="w-4 h-4 mr-2" /> Bulk Upload
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsBulkTransferModalOpen(true)}
                      >
                        <ArrowRightLeftIcon className="w-4 h-4 mr-2" /> Bulk
                        Transfer
                      </Button>
                      <Button onClick={() => setIsAddEmployeeModalOpen(true)}>
                        + Add Employee
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 mb-6">
                      <div className="w-full sm:w-[240px]">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Transfer Eligibility
                        </label>
                        <Select
                          value={filterEligibility}
                          onValueChange={setFilterEligibility}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by Eligibility" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Employees</SelectItem>
                            <SelectItem value="eligible">
                              Eligible for Transfer
                            </SelectItem>
                            <SelectItem value="pending">
                              Pending Transfer
                            </SelectItem>
                            <SelectItem value="home">At Home Unit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-full sm:w-[320px]">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Time at Current Unit
                        </label>
                        <Select
                          value={filterTransferDuration}
                          onValueChange={setFilterTransferDuration}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Time at Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Transfers</SelectItem>
                            <SelectItem value="under_6">
                              Transferred within last 6 months
                            </SelectItem>
                            <SelectItem value="over_6">
                              Transferred over 6 months ago
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full sm:w-[240px]">
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">
                          Employee Status
                        </label>
                        <Select
                          value={filterStatus}
                          onValueChange={setFilterStatus}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Filter by Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">
                              Active (Posted Only)
                            </SelectItem>
                            <SelectItem value="wa">Work Arrangement</SelectItem>
                            <SelectItem value="od">Other Duty</SelectItem>
                            <SelectItem value="ld">Light Duty</SelectItem>
                            <SelectItem value="leave">
                              On Leave / Long Leave
                            </SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                            <SelectItem value="deputation">
                              Deputation
                            </SelectItem>
                            <SelectItem value="training">
                              Training / Special Duty
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">SL No.</TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort("employees", "penNumber")
                            }
                          >
                            PEN{getSortIcon("employees", "penNumber")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => handleTableSort("employees", "name")}
                          >
                            Name{getSortIcon("employees", "name")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort("employees", "category")
                            }
                          >
                            Category{getSortIcon("employees", "category")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort("employees", "currentUnit")
                            }
                          >
                            Current Unit
                            {getSortIcon("employees", "currentUnit")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort("employees", "homeUnit")
                            }
                          >
                            Home Unit{getSortIcon("employees", "homeUnit")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort(
                                "employees",
                                "monthsInCurrentUnit",
                              )
                            }
                          >
                            Time at Unit
                            {getSortIcon("employees", "monthsInCurrentUnit")}
                          </TableHead>
                          <TableHead
                            className="cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() =>
                              handleTableSort("employees", "isEligible")
                            }
                          >
                            Transfer Eligibility
                            {getSortIcon("employees", "isEligible")}
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSortedData(
                          filteredEmployees,
                          "employees",
                          "name",
                          "asc",
                        ).map((emp, idx) => (
                          <TableRow key={emp.id}>
                            <TableCell className="text-gray-500 font-mono text-xs">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-mono text-sm text-gray-500">
                              {emp.penNumber || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium flex items-center">
                                {emp.name}{" "}
                                <span className="text-gray-400 font-mono text-xs ml-1">
                                  ({emp.penNumber || "N/A"})
                                </span>
                                {emp.isBadali && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 bg-yellow-100 text-yellow-800 text-[10px] py-0 px-1 border-yellow-200"
                                  >
                                    Badali
                                  </Badge>
                                )}
                                {emp.pendingTransfer && (
                                  <Badge
                                    variant="outline"
                                    className="ml-2 bg-amber-50 text-amber-800 text-[10px] py-0 px-1 border-amber-300 animate-pulse"
                                  >
                                    Transfer pending to {emp.pendingTransfer.targetUnit}
                                  </Badge>
                                )}
                              </div>
                              {emp.workArrangementUnit && (
                                <div
                                  className="text-xs text-indigo-600 mt-0.5"
                                  title={`Arranged at ${emp.workArrangementUnit} from ${emp.workArrangementFromDate} to ${emp.workArrangementToDate}`}
                                >
                                  WA: {emp.workArrangementUnit}
                                </div>
                              )}
                              {emp.workingAs && (
                                <div className="text-xs text-orange-600 mt-0.5">
                                  OD: {emp.workingAs}
                                </div>
                              )}
                              {emp.lightDutyAs && (
                                <div className="text-xs text-cyan-600 mt-0.5">
                                  LD: {emp.lightDutyAs}
                                </div>
                              )}
                              {emp.leaveReason && (
                                <div className="text-xs text-red-600 mt-0.5">
                                  Leave: {emp.leaveReason}{emp.leaveMonths ? ` (${emp.leaveMonths} mo)` : ""}
                                </div>
                              )}
                              {emp.suspensionReason && (
                                <div className="text-xs text-red-800 mt-0.5 font-semibold">
                                  Suspended: {emp.suspensionReason}
                                </div>
                              )}
                              {emp.deputationTo && (
                                <div className="text-xs text-purple-600 mt-0.5">
                                  Deputation: {emp.deputationTo}
                                </div>
                              )}
                              {emp.trainingType && (
                                <div className="text-xs text-teal-600 mt-0.5">
                                  Training/SD: {emp.trainingType}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{emp.category}</TableCell>
                            <TableCell>{emp.currentUnit}</TableCell>
                            <TableCell>
                              {emp.homeUnit}
                              {emp.currentUnit !== emp.homeUnit && (
                                <span className="text-gray-500 text-xs ml-1">
                                  ({emp.distanceToHome} km)
                                </span>
                              )}
                            </TableCell>
                            <TableCell>{emp.monthsInCurrentUnit} mo</TableCell>
                            <TableCell>
                              {emp.currentUnit === emp.homeUnit ? (
                                <Badge
                                  variant="outline"
                                  className="text-gray-500"
                                >
                                  At Home Unit
                                </Badge>
                              ) : emp.isEligible ? (
                                <Badge className="bg-green-600">
                                  Eligible ({emp.requiredIncumbencyMonths} mo
                                  req)
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  Pending ({emp.monthsInCurrentUnit}/
                                  {emp.requiredIncumbencyMonths} mo)
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right whitespace-nowrap">
                              {(() => {
                                const hasEditPermission = checkEditPermission(emp.currentUnit);
                                const hasXferPermission = checkTransferPermission(emp.currentUnit);
                                return (
                                  <>
                                    {!emp.workArrangementUnit && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                          if (!hasEditPermission) {
                                            alert("Your account does not have Edit privilege for unit: " + emp.currentUnit);
                                            return;
                                          }
                                          setWaEmployee(emp);
                                          setIsWAModalOpen(true);
                                        }}
                                        disabled={!hasEditPermission}
                                        className={hasEditPermission ? "text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" : "text-gray-300 opacity-40 cursor-not-allowed"}
                                        title={hasEditPermission ? "Assign Work Arrangement" : "Edit Lock"}
                                      >
                                        <UserIcon className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (!hasXferPermission) {
                                          alert("Your account does not have Transfer privilege for unit: " + emp.currentUnit);
                                          return;
                                        }
                                        setTransferringEmployee(emp);
                                        setIsTransferModalOpen(true);
                                      }}
                                      disabled={!hasXferPermission}
                                      className={hasXferPermission ? "text-green-600 hover:text-green-800 hover:bg-green-50" : "text-gray-300 opacity-40 cursor-not-allowed"}
                                      title={hasXferPermission ? "Transfer" : "Transfer Lock"}
                                    >
                                      <ArrowRightLeftIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (!hasEditPermission) {
                                          alert("Your account does not have Edit privilege for unit: " + emp.currentUnit);
                                          return;
                                        }
                                        handleEditClick(emp);
                                      }}
                                      disabled={!hasEditPermission}
                                      className={hasEditPermission ? "text-blue-500 hover:text-blue-700 hover:bg-blue-50" : "text-gray-300 opacity-40 cursor-not-allowed"}
                                      title={hasEditPermission ? "Edit" : "Edit Lock"}
                                    >
                                      <PencilIcon className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (!hasEditPermission) {
                                          alert("Your account does not have Edit privilege for unit: " + emp.currentUnit);
                                          return;
                                        }
                                        handleDeleteEmployee(emp.id);
                                      }}
                                      disabled={!hasEditPermission}
                                      className={hasEditPermission ? "text-red-500 hover:text-red-700 hover:bg-red-50" : "text-gray-300 opacity-40 cursor-not-allowed"}
                                      title={hasEditPermission ? "Delete" : "Delete Lock"}
                                    >
                                      <TrashIcon className="h-4 w-4" />
                                    </Button>
                                  </>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="categories" className="space-y-4">
                <CategoryManager
                  categories={categories}
                  categoryGroups={categoryGroups}
                  onRefresh={fetchEmployees}
                />
              </TabsContent>

              <TabsContent value="transfers" className="space-y-6">
                {(() => {
                  const pendingIncoming = employees.filter((e) => {
                    if (!e.pendingTransfer) return false;
                    if (currentUser?.role === "admin") return true;
                    if (currentUser?.allowedUnits?.includes("*")) return true;
                    const cleanTarget = e.pendingTransfer.targetUnit?.toLowerCase()?.trim();
                    return currentUser?.allowedUnits
                      ?.map((u) => u.toLowerCase().trim())
                      ?.includes(cleanTarget);
                  });

                  const pendingOutgoing = employees.filter((e) => {
                    if (!e.pendingTransfer) return false;
                    if (currentUser?.role === "admin") return true;
                    if (currentUser?.allowedUnits?.includes("*")) return true;
                    const cleanOld = e.pendingTransfer.oldUnit?.toLowerCase()?.trim();
                    return currentUser?.allowedUnits
                      ?.map((u) => u.toLowerCase().trim())
                      ?.includes(cleanOld);
                  });

                  return (
                    <div className="space-y-4">
                      {/* Simple Tabs Trigger Header */}
                      <div className="flex flex-wrap gap-2 border-b border-gray-150 pb-1">
                        <button
                          onClick={() => setTransferSubTab("incoming")}
                          className={`relative py-2 px-4 text-sm font-semibold transition-all focus:outline-none flex items-center gap-2 ${
                            transferSubTab === "incoming"
                              ? "border-b-2 border-amber-500 text-amber-900"
                              : "text-gray-500 hover:text-gray-755 hover:bg-slate-50 rounded-t-md"
                          }`}
                        >
                          📥 Incoming Pending
                          {pendingIncoming.length > 0 ? (
                            <span className="bg-rose-500 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none shrink-0 font-bold">
                              {pendingIncoming.length}
                            </span>
                          ) : (
                            <span className="bg-gray-150 text-gray-500 font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none shrink-0">0</span>
                          )}
                        </button>
                        <button
                          onClick={() => setTransferSubTab("outgoing")}
                          className={`relative py-2 px-4 text-sm font-semibold transition-all focus:outline-none flex items-center gap-2 ${
                            transferSubTab === "outgoing"
                              ? "border-b-2 border-amber-500 text-amber-900"
                              : "text-gray-500 hover:text-gray-755 hover:bg-slate-50 rounded-t-md"
                          }`}
                        >
                          📤 Outgoing Pending
                          {pendingOutgoing.length > 0 ? (
                            <span className="bg-sky-600 text-white font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none shrink-0 font-bold">
                              {pendingOutgoing.length}
                            </span>
                          ) : (
                            <span className="bg-gray-150 text-gray-500 font-mono text-[10px] px-1.5 py-0.5 rounded-full leading-none shrink-0">0</span>
                          )}
                        </button>
                        <button
                          onClick={() => setTransferSubTab("eligible")}
                          className={`py-2 px-4 text-sm font-semibold transition-all focus:outline-none flex items-center gap-1.5 ${
                            transferSubTab === "eligible"
                              ? "border-b-2 border-amber-500 text-amber-900"
                              : "text-gray-500 hover:text-gray-755 hover:bg-slate-50 rounded-t-md"
                          }`}
                        >
                          ⚙️ Process & Eligible Transfers
                        </button>
                        <button
                          onClick={() => setTransferSubTab("history")}
                          className={`py-2 px-4 text-sm font-semibold transition-all focus:outline-none flex items-center gap-1.5 ${
                            transferSubTab === "history"
                              ? "border-b-2 border-amber-500 text-amber-900"
                              : "text-gray-500 hover:text-gray-755 hover:bg-slate-50 rounded-t-md"
                          }`}
                        >
                          📜 Transfer History & Logs
                        </button>
                      </div>

                      {/* Tab Contents */}
                      {transferSubTab === "incoming" && (
                        <div className="space-y-4">
                          {pendingIncoming.length === 0 ? (
                            <Card className="border border-slate-150 bg-slate-50/20 shadow-xs">
                              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="text-4xl text-gray-400 animate-bounce">📥</div>
                                <h3 className="font-bold text-gray-800 mt-3">No Incoming Pending Transfers</h3>
                                <p className="text-gray-500 text-xs mt-1 max-w-sm">
                                  There are currently no inbound transfer requests awaiting acceptance by your unit/depot permissions bounds.
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {pendingIncoming.map((emp) => (
                                <div
                                  key={emp.id}
                                  className="p-4 bg-white rounded-lg border border-amber-200/60 flex flex-col gap-3 shadow-sm bg-gradient-to-br from-amber-50/10 to-transparent text-xs"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-gray-950 text-sm leading-tight">{emp.name}</h4>
                                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">PEN: {emp.penNumber || "N/A"}</p>
                                      <p className="text-xs text-gray-600 mt-1.5">Category: <span className="font-bold text-gray-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">{emp.category}</span></p>
                                    </div>
                                    <Badge variant="outline" className="bg-amber-100/50 text-amber-800 border-amber-300">
                                      Pending Accept
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-150">
                                    <span className="font-bold text-gray-600">{emp.pendingTransfer?.oldUnit}</span>
                                    <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                    <span className="font-bold text-emerald-800">{emp.pendingTransfer?.targetUnit}</span>
                                  </div>

                                  {emp.pendingTransfer?.reason && (
                                    <div className="text-xs text-slate-700 bg-amber-50/40 p-2 rounded border border-amber-100/30">
                                      <span className="font-semibold text-amber-800">Reason:</span> {emp.pendingTransfer.reason}
                                    </div>
                                  )}

                                  <div className="text-[10px] text-gray-400 flex justify-between pt-1">
                                    <span>Initiator: {emp.pendingTransfer?.initiatedBy || "Unknown"}</span>
                                    <span>Date: {emp.pendingTransfer?.targetDate || "N/A"}</span>
                                  </div>

                                  <div className="flex gap-2 items-center pt-2.5 border-t border-gray-100 mt-1">
                                    <Button
                                      size="sm"
                                      variant="default"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 flex items-center gap-1 font-bold text-xs h-8"
                                      onClick={() => acceptTransfer(emp.id)}
                                    >
                                      <CheckIcon className="h-3.5 w-3.5" /> Accept
                                    </Button>
                                    
                                    <div className="flex-[1.5] flex gap-1 items-center">
                                      <Input
                                        placeholder="Reject reason..."
                                        size={1}
                                        className="h-8 text-xs flex-1 bg-gray-50/50 border-gray-200"
                                        value={rejectReasons[emp.id] || ""}
                                        onChange={(e) => setRejectReasons({ ...rejectReasons, [emp.id]: e.target.value })}
                                      />
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-400 hover:text-red-600 border-red-200 hover:bg-rose-50 h-8 text-xs"
                                        onClick={() => rejectTransfer(emp.id, rejectReasons[emp.id] || "Rejected by target depot")}
                                      >
                                        <XIcon className="h-3.5 w-3.5" /> Reject
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {transferSubTab === "outgoing" && (
                        <div className="space-y-4">
                          {pendingOutgoing.length === 0 ? (
                            <Card className="border border-slate-150 bg-slate-50/20 shadow-xs">
                              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                                <div className="text-4xl text-gray-400">📤</div>
                                <h3 className="font-bold text-gray-800 mt-3">No Outgoing Pending Transfers</h3>
                                <p className="text-gray-500 text-xs mt-1 max-w-sm">
                                  There are no sent transfer requests currently waiting for target depot acceptance actions.
                                </p>
                              </CardContent>
                            </Card>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {pendingOutgoing.map((emp) => (
                                <div
                                  key={emp.id}
                                  className="p-4 bg-white rounded-lg border border-sky-200 flex flex-col gap-3 shadow-sm bg-gradient-to-br from-sky-50/10 to-transparent text-xs"
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-gray-950 text-sm leading-tight">{emp.name}</h4>
                                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">PEN: {emp.penNumber || "N/A"}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-sky-100 text-sky-805 border-sky-250">
                                      Sent Outgoing
                                    </Badge>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs bg-gray-50 p-2 rounded border border-gray-150">
                                    <span className="font-bold text-gray-600">{emp.pendingTransfer?.oldUnit}</span>
                                    <ArrowRightIcon className="h-3 w-3 text-gray-400" />
                                    <span className="font-bold text-sky-805">{emp.pendingTransfer?.targetUnit}</span>
                                  </div>

                                  <div className="text-[11px] text-gray-600 bg-sky-50/20 border border-sky-100 p-2 rounded">
                                    ⏱️ Awaiting accept action from depot: <span className="font-bold text-sky-900">{emp.pendingTransfer?.targetUnit}</span>
                                  </div>

                                  <div className="flex justify-between items-center pt-2.5 border-t border-gray-100 mt-1">
                                    <span className="text-[10px] text-gray-400 font-medium">By: {emp.pendingTransfer?.initiatedBy || "You"}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-500 hover:text-red-700 hover:bg-rose-50 h-8 text-xs font-semibold px-2 py-0 border border-dashed border-red-200"
                                      onClick={() => rejectTransfer(emp.id, "Cancelled by initiator")}
                                    >
                                      <XIcon className="h-3.5 w-3.5 mr-0.5" /> Cancel Request
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {transferSubTab === "eligible" && (
                  <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Process Transfers</CardTitle>
                      <CardDescription>
                        Select eligible employees and repatraite them or
                        transfer based on criteria.
                      </CardDescription>
                    </div>
                    <ExportOptions
                      data={eligibleTransfersData}
                      filename="eligible_transfers_list"
                      title="Export Eligible list"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("transfers", "name")
                              }
                            >
                              Employee{getSortIcon("transfers", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("transfers", "category")
                              }
                            >
                              Category{getSortIcon("transfers", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("transfers", "currentUnit")
                              }
                            >
                              Current Unit
                              {getSortIcon("transfers", "currentUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort(
                                  "transfers",
                                  "monthsInCurrentUnit",
                                )
                              }
                            >
                              Time at Unit
                              {getSortIcon("transfers", "monthsInCurrentUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("transfers", "distanceToHome")
                              }
                            >
                              Dist from Home
                              {getSortIcon("transfers", "distanceToHome")}
                            </TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees.filter((e) => e.isEligible),
                            "transfers",
                            "monthsInCurrentUnit",
                            "desc",
                          ).map((emp, idx) => (
                            <TableRow key={emp.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell>
                                <div className="font-semibold text-sm">
                                  {emp.name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {emp.penNumber || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell>{emp.category}</TableCell>
                              <TableCell>{emp.currentUnit}</TableCell>
                              <TableCell>
                                {emp.monthsInCurrentUnit} months
                              </TableCell>
                              <TableCell>
                                {emp.homeUnit} ({emp.distanceToHome} km)
                              </TableCell>
                              <TableCell>
                                <Select
                                  onValueChange={(val: string) => {
                                    if (val) requestTransfer(emp.id, val);
                                  }}
                                >
                                  <SelectTrigger className="w-full sm:w-[350px]">
                                    <SelectValue placeholder="Select Destination" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value={emp.homeUnit}>
                                      Repatriate to: {emp.homeUnit} (0 km)
                                    </SelectItem>
                                    {units
                                      .filter(
                                        (u) =>
                                          u.name !== emp.homeUnit &&
                                          u.name !== emp.currentUnit,
                                      )
                                      .map((u) => {
                                        const dist = getMockDistance(
                                          u.name,
                                          emp.homeUnit,
                                        );
                                        return (
                                          <SelectItem key={u.id} value={u.name}>
                                            {u.name} (Dist: {dist} km to Home)
                                          </SelectItem>
                                        );
                                      })}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                            </TableRow>
                          ))}
                          {filteredEmployees.filter((e) => e.isEligible)
                            .length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-8 text-gray-500"
                              >
                                No eligible employees found for transfer
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                )}

                {transferSubTab === "history" && (
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-1.5 text-slate-800">
                            📜 Transfer Activity Logs & History
                          </CardTitle>
                          <p className="text-xs text-slate-500 mt-1">
                            Chronological history of initiated, accepted, and rejected transfers.
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Search & Filter Inputs */}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                          placeholder="Search by name, PEN, or remarks..."
                          className="flex-1 text-sm h-9"
                          value={auditSearchQuery}
                          onChange={(e) => setAuditSearchQuery(e.target.value)}
                        />
                        <Select
                          value={filterStatus}
                          onValueChange={setFilterStatus}
                        >
                          <SelectTrigger className="w-[180px] h-9">
                            <SelectValue placeholder="Event Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Event Types</SelectItem>
                            <SelectItem value="initiated">Initiated</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="rejected">Rejected / Cancelled</SelectItem>
                            <SelectItem value="direct">Direct Transfers</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* History Logs Table */}
                      <div className="overflow-x-auto border rounded-lg">
                        <Table className="text-xs">
                          <TableHeader className="bg-slate-50">
                            <TableRow>
                              <TableHead className="w-[160px]">Timestamp</TableHead>
                              <TableHead className="w-[180px]">Employee</TableHead>
                              <TableHead className="w-[150px]">Event Type</TableHead>
                              <TableHead className="w-[200px]">Path / Route</TableHead>
                              <TableHead>Remarks / Reason</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              const lowerAllowed = currentUser?.allowedUnits?.map((u) => u.toLowerCase().trim()) || [];
                              const isAdmin = currentUser?.role === "admin" || currentUser?.allowedUnits?.includes("*");
                              
                              const transferLogs = history.filter((h) => {
                                const isTransfer = h.eventType?.includes("Transfer") || h.eventType === "Transfer";
                                if (!isTransfer) return false;

                                // Permitted check: must be admin or associated to the logs unit
                                const hasAccess = isAdmin || (
                                  (h.oldUnit && lowerAllowed.includes(h.oldUnit.toLowerCase().trim())) ||
                                  (h.newUnit && lowerAllowed.includes(h.newUnit.toLowerCase().trim()))
                                );
                                if (!hasAccess) return false;

                                // Filter status check
                                if (filterStatus !== "all") {
                                  const et = h.eventType.toLowerCase();
                                  if (filterStatus === "initiated" && !et.includes("initiated")) return false;
                                  if (filterStatus === "accepted" && !et.includes("accepted")) return false;
                                  if (filterStatus === "rejected" && !et.includes("reject") && !et.includes("cancel")) return false;
                                  if (filterStatus === "direct" && et !== "transfer" && !et.includes("bulk")) return false;
                                }

                                // Search check
                                if (auditSearchQuery) {
                                  const query = auditSearchQuery.toLowerCase().trim();
                                  const emp = employees.find((e) => e.id === h.employeeId || e.penNumber === h.penNumber);
                                  const eName = emp ? emp.name.toLowerCase() : "";
                                  const ePen = h.penNumber?.toLowerCase() || "";
                                  const eRemarks = h.remarks?.toLowerCase() || "";
                                  
                                  const matches = eName.includes(query) || ePen.includes(query) || eRemarks.includes(query) || h.eventType.toLowerCase().includes(query);
                                  if (!matches) return false;
                                }

                                return true;
                              });

                              if (transferLogs.length === 0) {
                                return (
                                  <TableRow>
                                    <TableCell colSpan={5} className="text-center py-10 text-gray-500 italic">
                                      No matching transfer activity history logs found.
                                    </TableCell>
                                  </TableRow>
                                );
                              }

                              // Sort by timestamp desc
                              transferLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                              return transferLogs.map((h) => {
                                const emp = employees.find((e) => e.id === h.employeeId || e.penNumber === h.penNumber);
                                const isInitiated = h.eventType?.toLowerCase()?.includes("initiated");
                                const isAccepted = h.eventType?.toLowerCase()?.includes("accepted");
                                const isRejected = h.eventType?.toLowerCase()?.includes("reject") || h.eventType?.toLowerCase()?.includes("cancel");

                                return (
                                  <TableRow key={h.id} className="hover:bg-slate-50/50">
                                    <TableCell className="font-mono text-gray-500 whitespace-nowrap">
                                      {new Date(h.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                      <div className="font-semibold text-slate-800">{emp ? emp.name : "KSRTC Employee"}</div>
                                      <div className="text-[10px] font-mono text-gray-500">PEN: {h.penNumber || "N/A"}</div>
                                    </TableCell>
                                    <TableCell>
                                      {isInitiated ? (
                                        <Badge className="bg-amber-100 text-amber-900 border-none">Initiated</Badge>
                                      ) : isAccepted ? (
                                        <Badge className="bg-emerald-100 text-emerald-900 border-none">Accepted</Badge>
                                      ) : isRejected ? (
                                        <Badge className="bg-orange-100 text-orange-950 border-none">Cancel/Reject</Badge>
                                      ) : (
                                        <Badge className="bg-blue-100 text-blue-900 border-none">Bypass/Direct</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {h.oldUnit && h.newUnit ? (
                                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                                          <span>{h.oldUnit}</span>
                                          <span className="text-gray-400">&rarr;</span>
                                          <span className="text-indigo-900">{h.newUnit}</span>
                                        </div>
                                      ) : h.newUnit ? (
                                        <span className="font-medium text-indigo-900">To: {h.newUnit}</span>
                                      ) : (
                                        <span className="text-gray-400 italic">Unknown Route</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-slate-600 max-w-xs truncate" title={h.remarks}>
                                      {h.remarks || "No remarks provided"}
                                    </TableCell>
                                  </TableRow>
                                );
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="work-arrangements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Work Arrangement Management</CardTitle>
                        <CardDescription>
                          Manage temporary assignments without losing parent
                          unit incumbency.
                        </CardDescription>
                      </div>
                      <ExportOptions
                        data={workArrangementsData}
                        filename="work_arrangements"
                        title="Export Work Arrangements"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("wa", "penNumber")}
                            >
                              PEN{getSortIcon("wa", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("wa", "name")}
                            >
                              Employee{getSortIcon("wa", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("wa", "category")}
                            >
                              Category{getSortIcon("wa", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("wa", "currentUnit")
                              }
                            >
                              Parent Unit{getSortIcon("wa", "currentUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("wa", "workArrangementUnit")
                              }
                            >
                              WA Target
                              {getSortIcon("wa", "workArrangementUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("wa", "workArrangementToDate")
                              }
                            >
                              Duration
                              {getSortIcon("wa", "workArrangementToDate")}
                            </TableHead>
                            <TableHead className="text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees.filter(
                              (e) => e.workArrangementUnit,
                            ),
                            "wa",
                            "workArrangementToDate",
                            "asc",
                          ).map((emp, idx) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const waDate = emp.workArrangementToDate
                              ? new Date(emp.workArrangementToDate)
                              : null;
                            const isExpiredWa =
                              waDate && waDate.getTime() < today.getTime();
                            const diffTime = waDate
                              ? waDate.getTime() - today.getTime()
                              : 0;
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );
                            const isDueSoon = diffDays > 0 && diffDays <= 30;

                            return (
                              <TableRow
                                key={emp.id}
                                className={
                                  isExpiredWa
                                    ? "bg-red-50"
                                    : isDueSoon
                                      ? "bg-orange-50"
                                      : ""
                                }
                              >
                                <TableCell className="text-gray-500 font-mono text-xs">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-500">
                                  {emp.penNumber}
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {emp.name}{" "}
                                    <span className="text-gray-400 font-mono text-xs">
                                      ({emp.penNumber || "N/A"})
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Order: {emp.workArrangementOrderNo || "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell>{emp.category}</TableCell>
                                <TableCell>{emp.currentUnit}</TableCell>
                                <TableCell className="font-semibold text-indigo-600">
                                  {emp.workArrangementUnit}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {emp.workArrangementFromDate} to{" "}
                                  {emp.workArrangementToDate}
                                  {isExpiredWa && (
                                    <Badge
                                      variant="destructive"
                                      className="ml-2 py-0"
                                    >
                                      Expired
                                    </Badge>
                                  )}
                                  {isDueSoon && (
                                    <Badge className="bg-orange-500 ml-2 py-0">
                                      Exp. in {diffDays}d
                                    </Badge>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    {emp.workArrangementReason}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs"
                                    onClick={() => endWorkArrangement(emp.id)}
                                  >
                                    End WA
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          {filteredEmployees.filter(
                            (e) => e.workArrangementUnit,
                          ).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={7}
                                className="text-center py-6 text-gray-500"
                              >
                                No active work arrangements found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="light-duty" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Light Duty Management</CardTitle>
                        <CardDescription>
                          Manage employees assigned to light duties.
                        </CardDescription>
                      </div>
                      <ExportOptions
                        data={lightDutyData}
                        filename="light_duty"
                        title="Export Light Duty"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("ld", "penNumber")}
                            >
                              PEN{getSortIcon("ld", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("ld", "name")}
                            >
                              Employee{getSortIcon("ld", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("ld", "category")}
                            >
                              Category{getSortIcon("ld", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("ld", "currentUnit")
                              }
                            >
                              Current Unit{getSortIcon("ld", "currentUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("ld", "lightDutyAs")
                              }
                            >
                              Light Duty As{getSortIcon("ld", "lightDutyAs")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees.filter((e) => e.lightDutyAs),
                            "ld",
                            "name",
                            "asc",
                          ).map((emp, idx) => (
                            <TableRow key={emp.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {emp.penNumber}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {emp.name}{" "}
                                  <span className="text-gray-400 font-mono text-xs">
                                    ({emp.penNumber || "N/A"})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{emp.category}</Badge>
                              </TableCell>
                              <TableCell>{emp.currentUnit}</TableCell>
                              <TableCell>{emp.lightDutyAs}</TableCell>
                            </TableRow>
                          ))}
                          {filteredEmployees.filter((e) => e.lightDutyAs)
                            .length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                No employees on light duty
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="other-duty" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Other Duty Management</CardTitle>
                        <CardDescription>
                          Manage employees assigned to other duties.
                        </CardDescription>
                      </div>
                      <ExportOptions
                        data={otherDutyData}
                        filename="other_duty"
                        title="Export Other Duty"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("od", "penNumber")}
                            >
                              PEN{getSortIcon("od", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("od", "name")}
                            >
                              Employee{getSortIcon("od", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("od", "category")}
                            >
                              Category{getSortIcon("od", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("od", "currentUnit")
                              }
                            >
                              Current Unit{getSortIcon("od", "currentUnit")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("od", "workingAs")}
                            >
                              Working As (OD){getSortIcon("od", "workingAs")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees.filter((e) => e.workingAs),
                            "od",
                            "name",
                            "asc",
                          ).map((emp, idx) => (
                            <TableRow key={emp.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {emp.penNumber}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {emp.name}{" "}
                                  <span className="text-gray-400 font-mono text-xs">
                                    ({emp.penNumber || "N/A"})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{emp.category}</Badge>
                              </TableCell>
                              <TableCell>{emp.currentUnit}</TableCell>
                              <TableCell>{emp.workingAs}</TableCell>
                            </TableRow>
                          ))}
                          {filteredEmployees.filter((e) => e.workingAs)
                            .length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                No employees on other duty
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="badali" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Badali (Substitute) Employees</CardTitle>
                        <CardDescription>
                          View and manage employees marked as Badali.
                        </CardDescription>
                      </div>
                      <ExportOptions
                        data={badaliData}
                        filename="badali_employees"
                        title="Export Badali List"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("badali", "penNumber")
                              }
                            >
                              PEN{getSortIcon("badali", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() => handleTableSort("badali", "name")}
                            >
                              Employee{getSortIcon("badali", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("badali", "category")
                              }
                            >
                              Category{getSortIcon("badali", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("badali", "currentUnit")
                              }
                            >
                              Current Unit{getSortIcon("badali", "currentUnit")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees.filter((e) => e.isBadali),
                            "badali",
                            "name",
                            "asc",
                          ).map((emp, idx) => (
                            <TableRow key={emp.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {emp.penNumber}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{emp.name}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{emp.category}</Badge>
                              </TableCell>
                              <TableCell>{emp.currentUnit}</TableCell>
                            </TableRow>
                          ))}
                          {filteredEmployees.filter((e) => e.isBadali)
                            .length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                No Badali employees found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deceased" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>Deceased / Expired Employees</CardTitle>
                        <CardDescription>
                          Records of employees marked as deceased.
                        </CardDescription>
                      </div>
                      <ExportOptions
                        data={deceasedEmployees}
                        filename="deceased_employees"
                        title="Export List"
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("deceased", "penNumber")
                              }
                            >
                              PEN{getSortIcon("deceased", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("deceased", "name")
                              }
                            >
                              Employee{getSortIcon("deceased", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("deceased", "category")
                              }
                            >
                              Category{getSortIcon("deceased", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("deceased", "currentUnit")
                              }
                            >
                              Unit{getSortIcon("deceased", "currentUnit")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            deceasedEmployees.filter(
                              (e) =>
                                (filterCategory === "all" ||
                                  e.category === filterCategory) &&
                                (filterUnit === "all" ||
                                  e.currentUnit === filterUnit) &&
                                (searchQuery.trim() === "" ||
                                  e.name
                                    .toLowerCase()
                                    .includes(searchQuery.toLowerCase()) ||
                                  (e.penNumber &&
                                    e.penNumber
                                      .toLowerCase()
                                      .includes(searchQuery.toLowerCase()))),
                            ),
                            "deceased",
                            "name",
                            "asc",
                          ).map((emp, idx) => (
                            <TableRow key={emp.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="font-mono text-sm text-gray-500">
                                {emp.penNumber}
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {emp.name}{" "}
                                  <span className="text-gray-400 font-mono text-xs">
                                    ({emp.penNumber || "N/A"})
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{emp.category}</Badge>
                              </TableCell>
                              <TableCell>{emp.currentUnit}</TableCell>
                            </TableRow>
                          ))}
                          {deceasedEmployees.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="text-center py-8 text-gray-500"
                              >
                                No deceased employee records found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Unit Shortages & Excess</CardTitle>
                      <ExportOptions
                        data={unitShortagesData}
                        filename="unit_shortages_excess"
                        title="Export"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {units.map((u) => {
                          const strengths = u.sanctionedStrength || {};
                          let totalS = 0;
                          let totalA = 0;
                          Object.keys(strengths).forEach((c) => {
                            totalS += strengths[c];
                            totalA += employees.filter(
                              (e) =>
                                e.currentUnit === u.name && e.category === c,
                            ).length;
                          });
                          const diff = totalA - totalS;
                          return (
                            <div
                              key={u.id}
                              className="flex justify-between items-center py-3 border-b"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {u.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Sanctioned: {totalS} | Actual: {totalA}
                                </div>
                              </div>
                              <div className="w-24 text-right">
                                {diff > 0 ? (
                                  <Badge className="bg-red-100 text-red-800">
                                    Excess: +{diff}
                                  </Badge>
                                ) : diff < 0 ? (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Shortage: {diff}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">Balanced</Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Work Arrangement Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {units.map((u) => {
                          const inflow = employees.filter(
                            (e) => e.workArrangementUnit === u.name,
                          ).length;
                          const outflow = employees.filter(
                            (e) =>
                              e.currentUnit === u.name && e.workArrangementUnit,
                          ).length;
                          if (inflow === 0 && outflow === 0) return null;
                          return (
                            <div
                              key={u.id}
                              className="flex justify-between items-center py-3 border-b"
                            >
                              <div className="font-medium text-sm">
                                {u.name}
                              </div>
                              <div className="flex gap-2">
                                {inflow > 0 && (
                                  <Badge className="bg-indigo-100 text-indigo-800">
                                    In: {inflow}
                                  </Badge>
                                )}
                                {outflow > 0 && (
                                  <Badge className="bg-orange-100 text-orange-800">
                                    Out: {outflow}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {employees.filter((e) => e.workArrangementUnit)
                          .length === 0 && (
                          <div className="text-sm text-gray-500">
                            No active workflows to report.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Expiring Arrangements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        {filteredEmployees
                          .filter(
                            (e) =>
                              e.workArrangementUnit && e.workArrangementToDate,
                          )
                          .sort(
                            (a, b) =>
                              new Date(a.workArrangementToDate!).getTime() -
                              new Date(b.workArrangementToDate!).getTime(),
                          )
                          .map((emp) => {
                            const expDate = new Date(
                              emp.workArrangementToDate!,
                            );
                            const isExpired =
                              expDate.getTime() < new Date().getTime();
                            return (
                              <div
                                key={emp.id}
                                className="flex flex-col py-3 border-b"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="font-medium text-sm">
                                    {emp.name}{" "}
                                    <span className="text-gray-400 font-mono text-xs">
                                      ({emp.penNumber || "N/A"})
                                    </span>
                                  </div>
                                  <Badge
                                    variant={
                                      isExpired ? "destructive" : "outline"
                                    }
                                  >
                                    {isExpired ? "Expired" : "Expiring"}:{" "}
                                    {expDate.toLocaleDateString()}
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {emp.currentUnit} &rarr;{" "}
                                  {emp.workArrangementUnit}
                                </div>
                              </div>
                            );
                          })}
                        {employees.filter((e) => e.workArrangementUnit)
                          .length === 0 && (
                          <div className="text-sm text-gray-500">
                            No expiring items.
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                    <CardHeader>
                      <CardTitle>
                        Staff Variance & Badali Summary by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Category</TableHead>
                              <TableHead className="text-right">
                                Sanctioned (Perm)
                              </TableHead>
                              <TableHead className="text-right">
                                Sanctioned (Badali)
                              </TableHead>
                              <TableHead className="text-right text-indigo-600">
                                Permanent
                              </TableHead>
                              <TableHead className="text-right text-yellow-600">
                                Badali
                              </TableHead>
                              <TableHead className="text-right font-bold">
                                Total Filled
                              </TableHead>
                              <TableHead className="text-right">
                                Perm Variance
                              </TableHead>
                              <TableHead className="text-right">
                                Badali Variance
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categories.map((c) => {
                              let totalSPerm = 0;
                              let totalSBadali = 0;
                              units.forEach((u) => {
                                if (u.sanctionedStrength?.[c.name])
                                  totalSPerm += u.sanctionedStrength[c.name];
                                if (
                                  (u as any).sanctionedBadaliStrength?.[c.name]
                                )
                                  totalSBadali += (u as any)
                                    .sanctionedBadaliStrength[c.name];
                              });
                              const perms = employees.filter(
                                (e) => e.category === c.name && !e.isBadali,
                              ).length;
                              const badalis = employees.filter(
                                (e) => e.category === c.name && !!e.isBadali,
                              ).length;
                              const totalA = perms + badalis;
                              const diffPerm = perms - totalSPerm;
                              const diffBadali = badalis - totalSBadali;
                              return (
                                <TableRow key={c.id}>
                                  <TableCell className="font-medium text-sm">
                                    {c.name}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {totalSPerm}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {totalSBadali}
                                  </TableCell>
                                  <TableCell className="text-right text-indigo-600">
                                    {perms}
                                  </TableCell>
                                  <TableCell className="text-right text-yellow-600">
                                    {badalis}
                                  </TableCell>
                                  <TableCell className="text-right font-bold">
                                    {totalA}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {diffPerm > 0 ? (
                                      <Badge className="bg-red-100 text-red-800">
                                        Excess: +{diffPerm}
                                      </Badge>
                                    ) : diffPerm < 0 ? (
                                      <Badge className="bg-orange-100 text-orange-800">
                                        Vacancy: {Math.abs(diffPerm)}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Balanced</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {diffBadali > 0 ? (
                                      <Badge className="bg-red-100 text-red-800">
                                        Excess: +{diffBadali}
                                      </Badge>
                                    ) : diffBadali < 0 ? (
                                      <Badge className="bg-orange-100 text-orange-800">
                                        Vacancy: {Math.abs(diffBadali)}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Balanced</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="col-span-1 lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Employees & Vacancy per Category</CardTitle>
                      <ExportOptions
                        data={categoryVacancyData}
                        filename="vacancy_per_category"
                        title="Export"
                      />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-16">SL No.</TableHead>
                              <TableHead
                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  handleTableSort("analytics", "category")
                                }
                              >
                                Category{getSortIcon("analytics", "category")}
                              </TableHead>
                              <TableHead
                                className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  handleTableSort("analytics", "sanctioned")
                                }
                              >
                                Sanctioned
                                {getSortIcon("analytics", "sanctioned")}
                              </TableHead>
                              <TableHead
                                className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  handleTableSort("analytics", "actual")
                                }
                              >
                                Actual{getSortIcon("analytics", "actual")}
                              </TableHead>
                              <TableHead
                                className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() =>
                                  handleTableSort("analytics", "diff")
                                }
                              >
                                Vacancy / Excess
                                {getSortIcon("analytics", "diff")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {getSortedData(
                              categories.map((c) => {
                                let totalS = 0;
                                units.forEach((u) => {
                                  if (u.sanctionedStrength?.[c.name])
                                    totalS += u.sanctionedStrength[c.name];
                                });
                                const totalA = employees.filter(
                                  (e) => e.category === c.name,
                                ).length;
                                const diff = totalA - totalS;
                                return {
                                  id: c.id,
                                  category: c.name,
                                  sanctioned: totalS,
                                  actual: totalA,
                                  diff,
                                };
                              }),
                              "analytics",
                              "category",
                              "asc",
                            ).map((row, idx) => (
                              <TableRow key={row.id}>
                                <TableCell className="text-gray-500 font-mono text-xs">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {row.category}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.sanctioned}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.actual}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.diff > 0 ? (
                                    <Badge className="bg-red-100 text-red-800">
                                      Excess: +{row.diff}
                                    </Badge>
                                  ) : row.diff < 0 ? (
                                    <Badge className="bg-orange-100 text-orange-800">
                                      Vacancy: {Math.abs(row.diff)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Balanced</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="retirement" className="space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Retirement Overview & Forecast</CardTitle>
                    <ExportOptions
                      data={retirementData}
                      filename="retirement_forecast"
                      title="Export Retirements"
                    />
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[800px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("retirement", "penNumber")
                              }
                            >
                              PEN{getSortIcon("retirement", "penNumber")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("retirement", "name")
                              }
                            >
                              Employee{getSortIcon("retirement", "name")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("retirement", "category")
                              }
                            >
                              Category{getSortIcon("retirement", "category")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("retirement", "currentUnit")
                              }
                            >
                              Current Unit
                              {getSortIcon("retirement", "currentUnit")}
                            </TableHead>
                            <TableHead
                              className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("retirement", "date")
                              }
                            >
                              Retirement Date{getSortIcon("retirement", "date")}
                            </TableHead>
                            <TableHead className="text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredEmployees
                              .map((e) => ({
                                emp: e,
                                date: getRetirementDate(
                                  e.dob,
                                  e.dateOfEntryInService,
                                  e.isBadali,
                                ),
                                name: e.name,
                                penNumber: e.penNumber,
                                category: e.category,
                                currentUnit: e.currentUnit,
                              }))
                              .filter((e) => e.date !== null),
                            "retirement",
                            "date",
                            "asc",
                          ).map(({ emp, date }, idx) => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const diffTime = date!.getTime() - today.getTime();
                            const diffMonths = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24 * 30),
                            );
                            const diffDays = Math.ceil(
                              diffTime / (1000 * 60 * 60 * 24),
                            );
                            const isRetiringSoon = diffMonths <= 6;
                            const isRetiringNext30Days =
                              diffDays > 0 && diffDays <= 30;
                            const isPastRetirement = diffDays <= 0;

                            return (
                              <TableRow
                                key={emp.id}
                                className={
                                  isPastRetirement
                                    ? "bg-red-50"
                                    : isRetiringNext30Days
                                      ? "bg-orange-50"
                                      : ""
                                }
                              >
                                <TableCell className="text-gray-500 font-mono text-xs">
                                  {idx + 1}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-gray-500">
                                  {emp.penNumber}
                                </TableCell>
                                <TableCell className="font-medium text-sm">
                                  {emp.name}{" "}
                                  <span className="text-gray-400 font-mono text-xs">
                                    ({emp.penNumber || "N/A"})
                                  </span>
                                </TableCell>
                                <TableCell className="text-sm">
                                  {emp.category}
                                </TableCell>
                                <TableCell className="text-sm">
                                  {emp.currentUnit}
                                </TableCell>
                                <TableCell className="text-right text-sm">
                                  {date!.toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge
                                    className={
                                      isPastRetirement
                                        ? "bg-red-500 hover:bg-red-600"
                                        : isRetiringNext30Days
                                          ? "bg-orange-500 hover:bg-orange-600"
                                          : ""
                                    }
                                    variant={
                                      (!isPastRetirement &&
                                        !isRetiringNext30Days &&
                                        (isRetiringSoon
                                          ? "default"
                                          : "secondary")) ||
                                      "default"
                                    }
                                  >
                                    {isPastRetirement
                                      ? "Retired"
                                      : isRetiringNext30Days
                                        ? `In ${diffDays}d`
                                        : `In ${diffMonths} mo`}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      {employees.filter((e) => e.dob).length === 0 && (
                        <div className="text-sm text-gray-500 mt-4 px-2">
                          No date of birth data available.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Global Audit History</CardTitle>
                      <CardDescription>
                        View all events systematically recorded by the system.
                      </CardDescription>
                    </div>
                    <ExportOptions
                      data={historyData}
                      filename="audit_history"
                      title="Export History"
                    />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 max-w-sm pb-1">
                      <SearchIcon className="w-4 h-4 text-gray-400 shrink-0" />
                      <Input
                        placeholder="Search by Employee Name, PEN or Remarks..."
                        value={auditSearchQuery}
                        onChange={(e) => setAuditSearchQuery(e.target.value)}
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-16">SL No.</TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("history", "createdAt")
                              }
                            >
                              Time{getSortIcon("history", "createdAt")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("history", "eventType")
                              }
                            >
                              Event{getSortIcon("history", "eventType")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("history", "employeeName")
                              }
                            >
                              Employee{getSortIcon("history", "employeeName")}
                            </TableHead>
                            <TableHead
                              className="cursor-pointer hover:bg-gray-50 transition-colors"
                              onClick={() =>
                                handleTableSort("history", "penNumber")
                              }
                            >
                              PEN{getSortIcon("history", "penNumber")}
                            </TableHead>
                            <TableHead>Changes</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {getSortedData(
                            filteredHistory
                              .slice(0, 50)
                              .map((h) => ({
                                ...h,
                                employeeName:
                                  employees.find((e) => e.id === h.employeeId)
                                    ?.name || "Unknown",
                              })),
                            "history",
                            "createdAt",
                            "desc",
                          ).map((h, idx) => (
                            <TableRow key={h.id}>
                              <TableCell className="text-gray-500 font-mono text-xs">
                                {idx + 1}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-xs text-gray-500">
                                {new Date(h.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{h.eventType}</Badge>
                              </TableCell>
                              <TableCell>{(h as any).employeeName}</TableCell>
                              <TableCell>{h.penNumber}</TableCell>
                              <TableCell className="text-sm">
                                {h.oldUnit && h.newUnit ? (
                                  <span>
                                    {h.oldUnit} &rarr; {h.newUnit}
                                  </span>
                                ) : null}
                                {h.oldCategory && h.newCategory ? (
                                  <span>
                                    {h.oldCategory} &rarr; {h.newCategory}
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {h.remarks}
                                {h.eventType === "Deletion (Soft Delete)" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-2 h-6 text-xs"
                                    onClick={async () => {
                                      try {
                                        const res = await fetch(
                                          `/api/employees/${h.employeeId}/restore`,
                                          { method: "POST" },
                                        );
                                        if (res.ok) {
                                          await fetchEmployees();
                                        }
                                      } catch (e) {
                                        console.error(e);
                                      }
                                    }}
                                  >
                                    Restore
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                          {history.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={6}
                                className="text-center py-4"
                              >
                                No audit history available yet.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports" className="space-y-4">
                <Tabs defaultValue="employee-report" className="w-full">
                  <TabsList className="bg-slate-100/50 p-1 border border-slate-200 h-10 mb-4">
                    <TabsTrigger value="employee-report" className="text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-violet-600 data-[state=active]:shadow-sm">
                      👤 Employee Transcript Report
                    </TabsTrigger>
                    {/* Placeholder for future reporting modules */}
                    <div className="ml-auto px-2 text-[10px] text-slate-400 font-medium italic hidden md:block">
                      Select report type to generate official KSRTC documentation
                    </div>
                  </TabsList>

                  <TabsContent value="employee-report" className="space-y-4 mt-0">
                    {/* Reports UI Component */}
                    <div className="grid gap-6 md:grid-cols-12">
                  {/* Left Column - search and list matches */}
                  <Card className="md:col-span-4 bg-card border shadow-sm h-fit">
                    <CardHeader className="pb-3 bg-slate-50/50">
                      <CardTitle className="text-base flex items-center gap-1.5 text-slate-800">
                        🔍 Employee Report Selector
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Enter employee name or PEN number to search and generate a comprehensive transcript.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                      {/* Search Selector */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                          Search by Name / PEN
                        </label>
                        <div className="relative">
                          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Type to search (e.g. Ramesh, 90123)"
                            className="pl-9 text-xs h-9 bg-slate-50/40 focus:bg-white"
                            value={reportSearchQuery}
                            onChange={(e) => {
                              setReportSearchQuery(e.target.value);
                              // Auto unset selected if query becomes empty
                              if (!e.target.value.trim()) {
                                setSelectedReportEmployee(null);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Matching suggestions list */}
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                          Matching Employees
                        </span>
                        <div className="max-h-[350px] overflow-y-auto divide-y border rounded-lg bg-white">
                          {(() => {
                            const trimmed = reportSearchQuery.trim().toLowerCase();
                            const matched = employees.filter(e => {
                              if (!trimmed) return false;
                              return (
                                e.name.toLowerCase().includes(trimmed) ||
                                (e.penNumber && e.penNumber.toLowerCase().includes(trimmed))
                              );
                            });

                            if (!trimmed) {
                              return (
                                <div className="p-4 text-center text-xs text-slate-400 italic">
                                  Type in the search bar above to lists matching employees.
                                </div>
                              );
                            }

                            if (matched.length === 0) {
                              return (
                                <div className="p-4 text-center text-xs text-slate-400 font-sans">
                                  No employees match your search query.
                                </div>
                              );
                            }

                            return matched.map(emp => {
                              const isSelected = selectedReportEmployee?.id === emp.id;
                              return (
                                <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => setSelectedReportEmployee(emp)}
                                  className={`w-full text-left p-3 text-xs transition-colors flex flex-col gap-1 items-start ${
                                    isSelected 
                                      ? "bg-violet-50 hover:bg-violet-100 text-violet-950 border-l-4 border-violet-500" 
                                      : "hover:bg-slate-50 text-slate-700"
                                  }`}
                                >
                                  <div className="flex justify-between w-full font-semibold">
                                    <span className="font-bold truncate text-slate-800">{emp.name}</span>
                                    {emp.penNumber && (
                                      <span className="font-mono bg-slate-100 px-1 rounded text-slate-600 scale-90">
                                        PEN {emp.penNumber}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex justify-between w-full text-[10px] text-slate-500 mt-0.5">
                                    <span>{emp.category}</span>
                                    <span className="font-medium text-slate-600">{emp.currentUnit}</span>
                                  </div>
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Right Column - Report Details Sheet */}
                  <div className="md:col-span-8 space-y-6">
                    {selectedReportEmployee ? (
                      (() => {
                        const emp = selectedReportEmployee;
                        // Find dynamic district and info
                        const unitObj = units.find(u => u.name === emp.currentUnit);
                        const empHistory = history.filter(h => h.employeeId === emp.id || h.penNumber === emp.penNumber);
                        
                        // Calculate years & months since joining
                        let serviceDurationStr = "N/A";
                        if (emp.dateOfEntryInService) {
                          try {
                            const entryD = new Date(emp.dateOfEntryInService);
                            const nowD = new Date();
                            const diffYears = nowD.getFullYear() - entryD.getFullYear();
                            const diffMonths = nowD.getMonth() - entryD.getMonth();
                            const totMonths = diffYears * 12 + diffMonths;
                            if (totMonths > 0) {
                              const y = Math.floor(totMonths / 12);
                              const m = totMonths % 12;
                              serviceDurationStr = `${y} Yr${y !== 1 ? 's' : ''} ${m} Mo${m !== 1 ? 's' : ''}`;
                            } else {
                              serviceDurationStr = "Less than a month";
                            }
                          } catch (e) {
                            serviceDurationStr = "N/A";
                          }
                        }

                        // Calculate age
                        let ageStr = "N/A";
                        if (emp.dob) {
                          try {
                            const dobD = new Date(emp.dob);
                            const nowD = new Date();
                            let calculatedAge = nowD.getFullYear() - dobD.getFullYear();
                            const monthDiff = nowD.getMonth() - dobD.getMonth();
                            if (monthDiff < 0 || (monthDiff === 0 && nowD.getDate() < dobD.getDate())) {
                              calculatedAge--;
                            }
                            ageStr = `${calculatedAge} Years`;
                          } catch (e) {
                            ageStr = "N/A";
                          }
                        }

                        // Raw formatted handler for Excel
                        const handleExportExcel = () => {
                          const profileRow = {
                            "Sl No.": 1,
                            "PEN Number": emp.penNumber || "N/A",
                            "Full Name": emp.name,
                            "Date of Birth": emp.dob || "N/A",
                            "Age": ageStr,
                            "Designation Category": emp.category,
                            "Current Posting Unit": emp.currentUnit,
                            "Distance to Home (km)": emp.distanceToHome ?? "N/A",
                            "Months in Current Unit": emp.monthsInCurrentUnit ?? 0,
                            "Home Station / Unit": emp.homeUnit || "N/A",
                            "Entry in Service": emp.dateOfEntryInService || "N/A",
                            "Total Estimated Service": serviceDurationStr,
                            "Type": emp.isBadali ? "Badali (Temporary)" : "Permanent",
                            "On Work Arrangement": emp.workArrangementUnit ? `Yes (${emp.workArrangementUnit})` : "No",
                            "Arranged Reason": emp.workArrangementReason || "N/A",
                            "Arranged Order No": emp.workArrangementOrderNo || "N/A",
                            "Light Duty Assigned": emp.lightDutyAs || "No",
                            "Other Duty Designation": emp.workingAs || "N/A",
                            "Active Leave Status": emp.leaveReason ? `On Leave (${emp.leaveReason})` : "Active / Available",
                            "Disciplinary Suspension": emp.suspensionReason ? `Suspended (${emp.suspensionReason})` : "None",
                            "Deceased": emp.isDeceased ? "Yes" : "No"
                          };

                          const ledgerRows = empHistory.map((h, sl) => ({
                            "Sl No.": sl + 1,
                            "Timestamp": new Date(h.createdAt).toLocaleString(),
                            "Event Action": h.eventType,
                            "Movement Sequence": h.oldUnit && h.newUnit ? `${h.oldUnit} -> ${h.newUnit}` : "No movement",
                            "Category Change": h.oldCategory && h.newCategory ? `${h.oldCategory} -> ${h.newCategory}` : "No category shift",
                            "Admin Remarks / Order Details": h.remarks || "No supplementary remarks found"
                          }));

                          const wsProfile = XLSX.utils.json_to_sheet([profileRow]);
                          const wsLedger = XLSX.utils.json_to_sheet(ledgerRows);
                          const wb = XLSX.utils.book_new();
                          XLSX.utils.book_append_sheet(wb, wsProfile, "Employee Core Profile");
                          XLSX.utils.book_append_sheet(wb, wsLedger, "Service Ledger Records");
                          XLSX.writeFile(wb, `KSRTC_Report_${emp.penNumber || emp.name.replace(/\s+/g, '_')}.xlsx`);
                        };

                        // CSV generator
                        const handleExportCSV = () => {
                          const profileString = [
                            "--- KSRTC STATE ROAD TRANSPORT CORPORATION ---",
                            "--- EMPLOYEE SERVICE RECORD PROFILE SUMMARY ---",
                            `PEN Number,${emp.penNumber || 'N/A'}`,
                            `Full Name,"${emp.name.replace(/"/g, '""')}"`,
                            `Date of Birth,${emp.dob || 'N/A'}`,
                            `Age,${ageStr}`,
                            `Designation Category,"${emp.category.replace(/"/g, '""')}"`,
                            `Current Posting Unit,"${emp.currentUnit.replace(/"/g, '""')}"`,
                            `Estimated Distance to Home (km),${emp.distanceToHome ?? 'N/A'}`,
                            `Months in Current Post,${emp.monthsInCurrentUnit ?? 0}`,
                            `Home Unit,"${emp.homeUnit ? emp.homeUnit.replace(/"/g, '""') : 'N/A'}"`,
                            `Date of Entry in Service,${emp.dateOfEntryInService || 'N/A'}`,
                            `Active Special Assignments,${emp.workArrangementUnit ? 'Work Arrangement' : emp.lightDutyAs ? 'Light Duty' : emp.workingAs ? 'Other Duty' : emp.leaveReason ? 'On Leave' : 'Standard Posting'}`,
                            "",
                            "--- HISTORIC TRANSCRIPT ACTIVITY LEDGER ---",
                            "Sl No,Timestamp,Event Action,Movement Sequence,Category Change,Remarks"
                          ];

                          const ledgerCSV = empHistory.map((h, sl) => {
                            const timestamp = `"${new Date(h.createdAt).toLocaleString().replace(/"/g, '""')}"`;
                            const action = `"${h.eventType.replace(/"/g, '""')}"`;
                            const pathway = h.oldUnit && h.newUnit ? `"${h.oldUnit.replace(/"/g, '""')} -> ${h.newUnit.replace(/"/g, '""')}"` : `"-"`;
                            const catChange = h.oldCategory && h.newCategory ? `"${h.oldCategory.replace(/"/g, '""')} -> ${h.newCategory.replace(/"/g, '""')}"` : `"-"`;
                            const rmks = `"${(h.remarks || '').replace(/"/g, '""')}"`;
                            return `${sl + 1},${timestamp},${action},${pathway},${catChange},${rmks}`;
                          });

                          const completeCSV = [...profileString, ...ledgerCSV].join("\n");
                          const blob = new Blob([completeCSV], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.setAttribute("href", url);
                          link.setAttribute("download", `KSRTC_Report_${emp.penNumber || 'Employee'}.csv`);
                          link.click();
                        };

                        // jsPDF high fidelity document builder
                        const handleExportPDF = () => {
                          // Orientation detection: If headers count > 7, use landscape. 
                          const ledgerHeaders = ["SL", "Timestamp", "Event Title", "Movement Logs / Category Details", "Admin Remarks"];
                          const isLandscape = ledgerHeaders.length > 7;
                          const orientation = isLandscape ? 'l' : 'p';
                          const doc = new jsPDF({ orientation }) as any;
                          
                          // Dimensions for framing
                          const pageWidth = isLandscape ? 297 : 210;
                          const pageHeight = isLandscape ? 210 : 297;
                          const frameWidth = pageWidth - 16;
                          const frameHeight = pageHeight - 17;

                          // Draw beautiful border framing
                          doc.setDrawColor(226, 232, 240); // Cool gray border
                          doc.setLineWidth(0.5);
                          doc.rect(8, 8, frameWidth, frameHeight);
                          
                          // Header title
                          doc.setFillColor(30, 41, 59); // Charcoal panel
                          doc.rect(8, 8, frameWidth, 25, "F");
                          
                          doc.setTextColor(255, 255, 255);
                          doc.setFontSize(14);
                          doc.setFont("helvetica", "bold");
                          doc.text("KERALA STATE ROAD TRANSPORT CORPORATION", 14, 18);
                          
                          doc.setFontSize(9);
                          doc.setFont("helvetica", "normal");
                          doc.setTextColor(245, 158, 11); // Amber
                          doc.text("COMPREHENSIVE EMPLOYEE TRANSCRIPT & SERVICE ACTIVITY BOOKLET", 14, 25);
                          
                          // Metadata alignment
                          doc.setTextColor(156, 163, 175);
                          doc.setFontSize(8);
                          doc.text(`EXTRACTED: ${new Date().toLocaleDateString()}`, frameWidth - 34, 20);

                          // Detailed Content
                          doc.setTextColor(30, 41, 59);
                          doc.setFontSize(11);
                          doc.text("SERVICE PROFILE SUMMARY", 14, 45);
                          
                          doc.setDrawColor(241, 245, 249);
                          doc.line(14, 47, 80, 47);

                          doc.setFontSize(9);
                          doc.setFont("helvetica", "bold");
                          doc.text("Employee Name:", 14, 55);
                          doc.text("PEN Number:", 14, 61);
                          doc.text("Category:", 14, 67);
                          doc.text("Current Unit:", 14, 73);
                          doc.text("Home Unit:", 14, 79);

                          doc.setFont("helvetica", "normal");
                          doc.text(emp.name, 45, 55);
                          doc.text(emp.penNumber || "N/A", 45, 61);
                          doc.text(emp.category, 45, 67);
                          doc.text(emp.currentUnit, 45, 73);
                          doc.text(emp.homeUnit || "Not Specified", 45, 79);

                          // History Ledger Table
                          doc.setFontSize(11);
                          doc.setFont("helvetica", "bold");
                          doc.text("HISTORIC ACTIVITY LEDGER", 14, 95);
                          
                          const historyData = empHistory.map((h, idx) => [
                            idx + 1,
                            new Date(h.createdAt).toLocaleString(),
                            h.eventType,
                            h.oldUnit && h.newUnit ? `${h.oldUnit} -> ${h.newUnit}` : h.newUnit || "-",
                            h.remarks || "-"
                          ]);

                          autoTable(doc, {
                            head: [ledgerHeaders],
                            body: historyData,
                            startY: 100,
                            theme: 'striped',
                            headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontSize: 8 },
                            bodyStyles: { fontSize: 7, cellPadding: 2 },
                            margin: { left: 14, right: 14 }
                          });

                          doc.save(`KSRTC_Profile_${emp.penNumber || "Employee"}.pdf`);
                        };

                        return (
                          <Card className="bg-card border shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-250">
                            {/* Card header with dynamic colors */}
                            <div className="bg-slate-905 text-white p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4" style={{ backgroundColor: "#1e293b" }}>
                              <div className="space-y-1">
                                <span className="text-[10px] bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {emp.isBadali ? "Badali Temporary staff" : "Permanent Officer Record"}
                                </span>
                                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                                  <span>👤 {emp.name}</span>
                                  {emp.penNumber && (
                                    <span className="text-slate-400 font-mono text-xs bg-slate-800/80 px-2 py-1 rounded">
                                      PEN: {emp.penNumber}
                                    </span>
                                  )}
                                </h3>
                                <p className="text-xs text-slate-300 font-sans">
                                  {emp.category} • Current Station: <span className="font-semibold text-amber-300">{emp.currentUnit}</span>
                                </p>
                              </div>

                              {/* Multi Format Export Button Deck */}
                              <div className="flex flex-wrap items-center gap-2">
                                <Button
                                  type="button"
                                  onClick={handleExportPDF}
                                  className="h-8 text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold"
                                >
                                  📥 Export PDF Document
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleExportExcel}
                                  className="h-8 text-xs bg-emerald-605 hover:bg-emerald-500 text-white font-semibold"
                                  style={{ backgroundColor: "#059669" }}
                                >
                                  📥 Export Multi-Sheet Excel
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleExportCSV}
                                  className="h-8 text-xs bg-indigo-605 hover:bg-indigo-500 text-white"
                                  style={{ backgroundColor: "#4f46e5" }}
                                >
                                  📥 Export Flat CSV
                                </Button>
                              </div>
                            </div>

                            <CardContent className="p-6 space-y-6">
                              {/* Grid containing basic info blocks */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-1 border-b border-slate-100">
                                  I. Personal Profile details
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Date of Birth</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.dob || "N/A"}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Age: {ageStr}</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Primary Appointment</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.category}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Class: {emp.isBadali ? "Temp / Badali" : "Regular"}</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Date of Joining (DOJ)</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.dateOfEntryInService || "N/A"}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Service: {serviceDurationStr}</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Native Home Base</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.homeUnit || "N/A"}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Preferred Region</span>
                                  </div>
                                </div>
                              </div>

                              {/* Posting Coordinates */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-1 border-b border-slate-100">
                                  II. Hosting Units &amp; Posting Metrics
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Current Unit / Depot</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.currentUnit}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">District group: {unitObj ? getUnitDistrict(unitObj) : "Other"}</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Months in Current Post</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.monthsInCurrentUnit ?? 0} Months</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Since last relocation</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Preferred Home Unit</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">{emp.homeUnit || "N/A"}</p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Registered station option</span>
                                  </div>
                                  <div className="bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Distance to Preferred Unit</span>
                                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                                      {emp.distanceToHome != null ? `${emp.distanceToHome} km` : "N/A km"}
                                    </p>
                                    <span className="text-[9px] text-slate-400 mt-1 block">Geospatial calculation</span>
                                  </div>
                                </div>
                              </div>

                              {/* Specialty Duties and Alerts */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-1 border-b border-slate-100">
                                  III. Active Specialty Deployment Assignments
                                </h4>
                                <div className="space-y-3">
                                  {/* Work Arrangement */}
                                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 border rounded-lg bg-indigo-50/20 border-indigo-100">
                                    <div className="space-y-1">
                                      <p className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                                        <span>🏢 Work Arrangement Status (WA)</span>
                                        {emp.workArrangementUnit ? (
                                          <Badge className="bg-indigo-600 text-white font-semibold">ACTIVE</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-indigo-700 bg-white border-indigo-200">INACTIVE</Badge>
                                        )}
                                      </p>
                                      {emp.workArrangementUnit ? (
                                        <p className="text-[11px] text-slate-600 leading-normal font-sans">
                                          Arranged to work at <strong className="text-indigo-900">{emp.workArrangementUnit}</strong> since {emp.workArrangementFromDate || "N/A"} to {emp.workArrangementToDate || "N/A"}.
                                        </p>
                                      ) : (
                                        <p className="text-[11px] text-slate-500 leading-normal font-sans">
                                          Employee is currently working at their standard registered current posting depot.
                                        </p>
                                      )}
                                    </div>
                                    {emp.workArrangementUnit && (
                                      <div className="text-right sm:text-right mt-2 sm:mt-0 text-[11px] font-mono bg-indigo-50 p-2 border border-indigo-100 rounded text-indigo-950">
                                        <p>Order: {emp.workArrangementOrderNo || "N/A"}</p>
                                        <p>Reason: {emp.workArrangementReason || "N/A"}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Light Duty / Other Duty */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Light Duty */}
                                    <div className="p-3.5 border rounded-lg bg-emerald-50/20 border-emerald-100 flex flex-col justify-between">
                                      <div>
                                        <p className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                          <span>🩺 Light Duty Assignment</span>
                                          {emp.lightDutyAs ? (
                                            <Badge className="bg-emerald-600 text-white">ENABLED</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-emerald-700 bg-white border-emerald-200">NONE</Badge>
                                          )}
                                        </p>
                                        <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-sans">
                                          {emp.lightDutyAs 
                                            ? `Assigned restricted alternative operational tasks under light duty: "${emp.lightDutyAs}"` 
                                            : "Employee is fully cleared for standard operational duties."}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Other Duty */}
                                    <div className="p-3.5 border rounded-lg bg-sky-50/20 border-sky-100 flex flex-col justify-between">
                                      <div>
                                        <p className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                                          <span>⚙️ Other Duty Designation</span>
                                          {emp.workingAs ? (
                                            <Badge className="bg-sky-600 text-white">ASSIGNED</Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-sky-700 bg-white border-sky-200">NONE</Badge>
                                          )}
                                        </p>
                                        <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-sans">
                                          {emp.workingAs 
                                            ? `Currently operating under proxy designation task as: "${emp.workingAs}"` 
                                            : "No special other-duty proxy title declared."}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Leave & Disciplinary */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {/* Leave Status */}
                                    <div className="p-3.5 border rounded-lg bg-amber-50/20 border-amber-100">
                                      <p className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                        <span>📅 Active Leave Status</span>
                                        {emp.leaveReason ? (
                                          <Badge className="bg-amber-600 text-white font-semibold">ON LEAVE</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-amber-700 bg-white border-amber-200">AVAILABLE</Badge>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-sans">
                                        {emp.leaveReason 
                                          ? `Absent/Unposted from standard shifts: "${emp.leaveReason}" (Duration: ${emp.leaveMonths || 0} months)` 
                                          : "Fully reporting for schedule slots. No leave logged."}
                                      </p>
                                    </div>

                                    {/* Suspension */}
                                    <div className="p-3.5 border rounded-lg bg-rose-50/20 border-rose-100">
                                      <p className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                                        <span>⚠️ Disciplinary Suspension Status</span>
                                        {emp.suspensionReason ? (
                                          <Badge className="bg-rose-600 text-white">SUSPENDED</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-rose-700 bg-white border-rose-250">CLEAR</Badge>
                                        )}
                                      </p>
                                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1 font-sans">
                                        {emp.suspensionReason 
                                          ? `Active disciplinary actions applied. Reason: "${emp.suspensionReason}"` 
                                          : "No active disciplinary, charge sheet, or suspension sanctions registered."}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Historic chronological ledger */}
                              <div>
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-1 border-b border-slate-100">
                                  IV. Historic Service Ledger &amp; Event Transcript ({empHistory.length} logs)
                                </h4>
                                <div className="border rounded-lg overflow-hidden bg-white">
                                  <Table>
                                    <TableHeader>
                                      <TableRow className="bg-slate-50">
                                        <TableHead className="w-16">Sl No.</TableHead>
                                        <TableHead>Time &amp; date</TableHead>
                                        <TableHead>Event Type</TableHead>
                                        <TableHead>Movement Details</TableHead>
                                        <TableHead>Remarks</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="text-xs">
                                      {empHistory.map((h, sl) => (
                                        <TableRow key={h.id}>
                                          <TableCell className="font-mono text-slate-400">{sl + 1}</TableCell>
                                          <TableCell className="text-slate-500 whitespace-nowrap">
                                            {new Date(h.createdAt).toLocaleString()}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant="outline" className="bg-slate-50 border-slate-200">
                                              {h.eventType}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            {h.oldUnit && h.newUnit ? (
                                              <span className="font-semibold text-slate-700">
                                                {h.oldUnit} &rarr; {h.newUnit}
                                              </span>
                                            ) : h.oldCategory && h.newCategory ? (
                                              <span className="font-semibold text-slate-700">
                                                {h.oldCategory} &rarr; {h.newCategory}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 italic">No movement</span>
                                            )}
                                          </TableCell>
                                          <TableCell className="text-slate-600 font-sans">{h.remarks || "-"}</TableCell>
                                        </TableRow>
                                      ))}
                                      {empHistory.length === 0 && (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-4 text-slate-400 italic font-sans">
                                            No transaction logs exist yet for this employee.
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()
                    ) : (
                      <Card className="bg-slate-50/50 border border-dashed rounded-xl p-8 text-center h-[450px] flex flex-col justify-center items-center">
                        <div className="bg-violet-100 p-4 rounded-full text-violet-600 mb-4 animate-bounce">
                          <FileTextIcon className="h-8 w-8" />
                        </div>
                        <h4 className="text-base font-bold text-slate-800">No Employee Selected</h4>
                        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4 leading-relaxed font-sans">
                          To generate a complete official transcript with service records, and download logs in various formats, select an employee from the selector list on the left.
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

              {currentUser?.role === "admin" && (
                <TabsContent value="admin-settings">
                  <AdminSettings
                    units={units}
                    getAuthHeaders={getAuthHeaders}
                    onRefresh={fetchEmployees}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}
      </main>

      {/* Add/Edit Employee Modal */}
      {isAddEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/50">
              <h2 className="text-xl font-semibold">
                {editingEmployeeId ? "Employee Profile" : "Add New Employee"}
              </h2>
              <button
                className="text-muted-foreground hover:text-foreground font-bold"
                onClick={() => {
                  setIsAddEmployeeModalOpen(false);
                  setEditingEmployeeId(null);
                  setEmployeeError(null);
                }}
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-0 bg-card">
              {employeeError && (
                <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-md text-sm mx-6 mt-4 font-medium">
                  {employeeError}
                </div>
              )}
              {editingEmployeeId ? (
                <Tabs defaultValue="details" className="w-full">
                  <div className="px-6 pt-4">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="history">Service History</TabsTrigger>
                      <TabsTrigger value="transfer-history">
                        Transfer History
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="details">
                    <form
                      onSubmit={handleAddEmployee}
                      className="px-6 py-4 space-y-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Name *
                          </label>
                          <Input
                            required
                            value={newEmp.name}
                            onChange={(e) =>
                              setNewEmp({ ...newEmp, name: e.target.value })
                            }
                            placeholder="Employee Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            PEN Number
                          </label>
                          <Input
                            value={newEmp.penNumber}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                penNumber: e.target.value.replace(/\s+/g, ""),
                              })
                            }
                            placeholder="PEN Number (no spaces)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Date of Birth
                          </label>
                          <Input
                            type="date"
                            value={newEmp.dob}
                            onChange={(e) =>
                              setNewEmp({ ...newEmp, dob: e.target.value })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Original Designation (Category) *
                          </label>
                          <Select
                            required
                            value={newEmp.category}
                            onValueChange={(val) =>
                              setNewEmp({ ...newEmp, category: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Working As (Other Duty)
                          </label>
                          <Input
                            value={newEmp.workingAs}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                workingAs: e.target.value,
                              })
                            }
                            placeholder="e.g. Inspector"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Light Duty As
                          </label>
                          <Input
                            value={newEmp.lightDutyAs}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                lightDutyAs: e.target.value,
                              })
                            }
                            placeholder="e.g. Guard"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Leave/Long Leave Reason
                          </label>
                          <Input
                            value={newEmp.leaveReason}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                leaveReason: e.target.value,
                              })
                            }
                            placeholder="e.g. LWA, Medical"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                            Leave Duration (Months)
                            <span className="text-xs text-muted-foreground font-normal">(Extends required incumbency)</span>
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={newEmp.leaveMonths || ""}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                leaveMonths: Number(e.target.value) || 0,
                              })
                            }
                            placeholder="e.g. 6"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Suspension Reason
                          </label>
                          <Input
                            value={newEmp.suspensionReason}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                suspensionReason: e.target.value,
                              })
                            }
                            placeholder="e.g. Disciplinary Action"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Deputation To
                          </label>
                          <Input
                            value={newEmp.deputationTo}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                deputationTo: e.target.value,
                              })
                            }
                            placeholder="e.g. K-SWIFT"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Training / Special Duty
                          </label>
                          <Input
                            value={newEmp.trainingType}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                trainingType: e.target.value,
                              })
                            }
                            placeholder="e.g. Induction Training"
                          />
                        </div>
                        <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                          <h3 className="font-medium text-sm mb-3">
                            Work Arrangement Details
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Work Arrangement Unit
                              </label>
                              <Select
                                value={newEmp.workArrangementUnit}
                                onValueChange={(val) =>
                                  setNewEmp({
                                    ...newEmp,
                                    workArrangementUnit: val,
                                  })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select WA Unit" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">None</SelectItem>
                                  {(allUnits && allUnits.length > 0 ? allUnits : units).map((u) => (
                                    <SelectItem key={u.id} value={u.name}>
                                      {u.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Order Number
                              </label>
                              <Input
                                value={newEmp.workArrangementOrderNo}
                                onChange={(e) =>
                                  setNewEmp({
                                    ...newEmp,
                                    workArrangementOrderNo: e.target.value,
                                  })
                                }
                                placeholder="e.g. WA/2026/01"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                From Date
                              </label>
                              <Input
                                type="date"
                                value={newEmp.workArrangementFromDate}
                                onChange={(e) =>
                                  setNewEmp({
                                    ...newEmp,
                                    workArrangementFromDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                To Date
                              </label>
                              <Input
                                type="date"
                                value={newEmp.workArrangementToDate}
                                onChange={(e) =>
                                  setNewEmp({
                                    ...newEmp,
                                    workArrangementToDate: e.target.value,
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Current (Parent) Unit *
                          </label>
                          <Select
                            required
                            value={newEmp.currentUnit}
                            onValueChange={(val) =>
                              setNewEmp({ ...newEmp, currentUnit: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Current Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {units.map((u) => (
                                <SelectItem key={u.id} value={u.name}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Home Unit *
                          </label>
                          <Select
                            required
                            value={newEmp.homeUnit}
                            onValueChange={(val) =>
                              setNewEmp({ ...newEmp, homeUnit: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Home Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              {(allUnits && allUnits.length > 0 ? allUnits : units).map((u) => (
                                <SelectItem key={u.id} value={u.name}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Date of Entry in Service
                          </label>
                          <Input
                            type="date"
                            value={newEmp.dateOfEntryInService}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                dateOfEntryInService: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Date of Entry in Current Unit
                          </label>
                          <Input
                            type="date"
                            value={newEmp.dateOfEntry}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                dateOfEntry: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="md:col-span-2 mt-2">
                          <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newEmp.isBadali || false}
                              onChange={(e) =>
                                setNewEmp({
                                  ...newEmp,
                                  isBadali: e.target.checked,
                                })
                              }
                              className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>
                              Is Badali (Substitute/Temporary) Employee?
                            </span>
                          </label>
                        </div>
                      </div>

                      {editingEmployeeId && (
                        <div className="mt-4 p-4 border rounded bg-red-50 flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-red-800">
                              Mark as Deceased (Expired)
                            </h4>
                            <p className="text-xs text-red-600 mt-1">
                              Check this box if the employee has expired
                              (deceased). They will be moved to the Deceased
                              list.
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="isDeceased"
                              checked={newEmp.isDeceased}
                              onChange={(e) =>
                                setNewEmp({
                                  ...newEmp,
                                  isDeceased: e.target.checked,
                                })
                              }
                              className="w-5 h-5 accent-red-600 cursor-pointer"
                            />
                            <label
                              htmlFor="isDeceased"
                              className="text-sm font-medium text-red-800 cursor-pointer"
                            >
                              Deceased
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                        <Button
                          variant="outline"
                          type="button"
                          onClick={() => {
                            setIsAddEmployeeModalOpen(false);
                            setEditingEmployeeId(null);
                            setEmployeeError(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">Save Changes</Button>
                      </div>
                    </form>
                  </TabsContent>
                  <TabsContent value="history">
                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                      {history.filter((h) => h.employeeId === editingEmployeeId)
                        .length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No history available for this employee.
                        </div>
                      ) : (
                        <div className="space-y-4 border-l-2 border-gray-200 ml-3">
                          {history
                            .filter((h) => h.employeeId === editingEmployeeId)
                            .map((ev) => (
                              <div key={ev.id} className="relative pl-6 pb-4">
                                <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
                                <div className="text-sm font-semibold">
                                  {ev.eventType}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {new Date(ev.createdAt).toLocaleString()}
                                </div>
                                {ev.oldUnit && ev.newUnit && (
                                  <div className="text-sm mt-1 text-gray-700">
                                    Transfer: {ev.oldUnit} &rarr; {ev.newUnit}
                                  </div>
                                )}
                                {ev.oldCategory && ev.newCategory && (
                                  <div className="text-sm mt-1 text-gray-700">
                                    Promoted: {ev.oldCategory} &rarr;{" "}
                                    {ev.newCategory}
                                  </div>
                                )}
                                {ev.remarks && (
                                  <div className="text-sm mt-1 text-gray-600 bg-gray-50 p-2 rounded">
                                    {ev.remarks}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="transfer-history">
                    <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
                      {history.filter(
                        (h) =>
                          h.employeeId === editingEmployeeId &&
                          (h.eventType.includes("Transfer") ||
                            (h.oldUnit && h.newUnit)),
                      ).length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                          No transfer history available for this employee.
                        </div>
                      ) : (
                        <div className="space-y-4 border-l-2 border-indigo-200 ml-3">
                          {history
                            .filter(
                              (h) =>
                                h.employeeId === editingEmployeeId &&
                                (h.eventType.includes("Transfer") ||
                                  (h.oldUnit && h.newUnit)),
                            )
                            .map((ev) => (
                              <div key={ev.id} className="relative pl-6 pb-4">
                                <div className="absolute w-3 h-3 bg-indigo-500 rounded-full -left-[7px] top-1.5 border-2 border-white"></div>
                                <div className="text-sm font-semibold text-indigo-900">
                                  {ev.eventType}
                                </div>
                                <div className="text-xs text-indigo-500 font-mono">
                                  {new Date(ev.createdAt).toLocaleDateString()}{" "}
                                  {new Date(ev.createdAt).toLocaleTimeString()}
                                </div>
                                {ev.oldUnit && ev.newUnit && (
                                  <div className="text-sm mt-1 text-gray-800 bg-indigo-50 inline-block px-2 py-1 rounded border border-indigo-100">
                                    Transferred from{" "}
                                    <span className="font-semibold">
                                      {ev.oldUnit}
                                    </span>{" "}
                                    to{" "}
                                    <span className="font-semibold">
                                      {ev.newUnit}
                                    </span>
                                  </div>
                                )}
                                {ev.remarks && (
                                  <div className="text-sm mt-1 text-gray-600 italic">
                                    {ev.remarks}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <form
                  onSubmit={handleAddEmployee}
                  className="px-6 py-4 space-y-4"
                >
                  {/* Form inputs for Add Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Name *
                      </label>
                      <Input
                        required
                        value={newEmp.name}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, name: e.target.value })
                        }
                        placeholder="Employee Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        PEN Number
                      </label>
                      <Input
                        value={newEmp.penNumber}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, penNumber: e.target.value.replace(/\s+/g, "") })
                        }
                        placeholder="PEN Number (no spaces)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Birth
                      </label>
                      <Input
                        type="date"
                        value={newEmp.dob}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, dob: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Original Designation (Category) *
                      </label>
                      <Select
                        required
                        value={newEmp.category}
                        onValueChange={(val) =>
                          setNewEmp({ ...newEmp, category: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Working As (Other Duty)
                      </label>
                      <Input
                        value={newEmp.workingAs}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, workingAs: e.target.value })
                        }
                        placeholder="e.g. Inspector"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Light Duty As
                      </label>
                      <Input
                        value={newEmp.lightDutyAs}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, lightDutyAs: e.target.value })
                        }
                        placeholder="e.g. Guard"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Leave/Long Leave Reason
                      </label>
                      <Input
                        value={newEmp.leaveReason}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, leaveReason: e.target.value })
                        }
                        placeholder="e.g. LWA, Medical"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1.5">
                        Leave Duration (Months)
                        <span className="text-xs text-muted-foreground font-normal">(Extends required incumbency)</span>
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={newEmp.leaveMonths || ""}
                        onChange={(e) =>
                          setNewEmp({
                            ...newEmp,
                            leaveMonths: Number(e.target.value) || 0,
                          })
                        }
                        placeholder="e.g. 6"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Suspension Reason
                      </label>
                      <Input
                        value={newEmp.suspensionReason}
                        onChange={(e) =>
                          setNewEmp({
                            ...newEmp,
                            suspensionReason: e.target.value,
                          })
                        }
                        placeholder="e.g. Disciplinary Action"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Deputation To
                      </label>
                      <Input
                        value={newEmp.deputationTo}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, deputationTo: e.target.value })
                        }
                        placeholder="e.g. K-SWIFT"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Training / Special Duty
                      </label>
                      <Input
                        value={newEmp.trainingType}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, trainingType: e.target.value })
                        }
                        placeholder="e.g. Induction Training"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 border-t pt-4 mt-2">
                      <h3 className="font-medium text-sm mb-3">
                        Work Arrangement Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Work Arrangement Unit
                          </label>
                          <Select
                            value={newEmp.workArrangementUnit}
                            onValueChange={(val) =>
                              setNewEmp({ ...newEmp, workArrangementUnit: val })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select WA Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">None</SelectItem>
                              {(allUnits && allUnits.length > 0 ? allUnits : units).map((u) => (
                                <SelectItem key={u.id} value={u.name}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Order Number
                          </label>
                          <Input
                            value={newEmp.workArrangementOrderNo}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                workArrangementOrderNo: e.target.value,
                              })
                            }
                            placeholder="e.g. WA/2026/01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            From Date
                          </label>
                          <Input
                            type="date"
                            value={newEmp.workArrangementFromDate}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                workArrangementFromDate: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            To Date
                          </label>
                          <Input
                            type="date"
                            value={newEmp.workArrangementToDate}
                            onChange={(e) =>
                              setNewEmp({
                                ...newEmp,
                                workArrangementToDate: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Current (Parent) Unit *
                      </label>
                      <Select
                        required
                        value={newEmp.currentUnit}
                        onValueChange={(val) =>
                          setNewEmp({ ...newEmp, currentUnit: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Current Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map((u) => (
                            <SelectItem key={u.id} value={u.name}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Home Unit *
                      </label>
                      <Select
                        required
                        value={newEmp.homeUnit}
                        onValueChange={(val) =>
                          setNewEmp({ ...newEmp, homeUnit: val })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Home Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {(allUnits && allUnits.length > 0 ? allUnits : units).map((u) => (
                            <SelectItem key={u.id} value={u.name}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Entry in Service
                      </label>
                      <Input
                        type="date"
                        value={newEmp.dateOfEntryInService}
                        onChange={(e) =>
                          setNewEmp({
                            ...newEmp,
                            dateOfEntryInService: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Date of Entry in Current Unit *
                      </label>
                      <Input
                        required
                        type="date"
                        value={newEmp.dateOfEntry}
                        onChange={(e) =>
                          setNewEmp({ ...newEmp, dateOfEntry: e.target.value })
                        }
                      />
                    </div>
                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newEmp.isBadali || false}
                          onChange={(e) =>
                            setNewEmp({ ...newEmp, isBadali: e.target.checked })
                          }
                          className="rounded border-gray-300 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Is Badali (Substitute/Temporary) Employee?</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setIsAddEmployeeModalOpen(false);
                        setEmployeeError(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Employee</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Bulk Upload Employees</h2>
              <button
                className="text-muted-foreground hover:text-foreground font-bold"
                onClick={() => setIsBulkUploadModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleBulkUpload} className="px-6 py-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">
                    Upload CSV File
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() =>
                      downloadCsvTemplate(
                        "bulk_employees_template.csv",
                        "penNumber,name,category,currentUnit,homeUnit,dateOfEntryInCurrentUnit,dateOfEntryInService,workingAs,leaveReason,lightDutyAs,leaveMonths\n900012,John Doe,DRIVER,ATD,ATD,2022-01-01,2020-01-01,,,,,0",
                      )
                    }
                  >
                    <DownloadIcon className="w-3 h-3 mr-1" /> Download Template
                  </Button>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-all group relative">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => handleCSVFileSelect(e, setBulkCsvText)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <UploadIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {bulkCsvText ? "✅ File Loaded Ready for Upload" : "Click or Drag CSV File to Upload"}
                    </p>
                    <p className="text-xs text-slate-400">
                      Standardized KSRTC Personnel Data Format (.csv)
                    </p>
                  </div>
                </div>
                {bulkCsvText && (
                  <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-2">Data Preview (First 2 rows)</p>
                    <pre className="text-[10px] text-blue-900/70 font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {bulkCsvText.split('\n').slice(0, 3).join('\n')}
                    </pre>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Please include header row. Columns: PEN, Name, Category,
                  Current Unit, Home Unit, Date of Entry (Unit), Date of Entry
                  in Service, Working As (OD), Leave Reason, Light Duty As, Leave Duration (Months).
                </p>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsBulkUploadModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Upload CSV</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Transfer Modal */}
      {isTransferModalOpen && transferringEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Transfer Employee</h2>
              <button
                className="text-muted-foreground hover:text-foreground font-bold"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferringEmployee(null);
                  setTransferReason("");
                  setTransferError(null);
                }}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleManualTransferSubmit}
              className="px-6 py-4 space-y-4"
            >
              {transferError && (
                <div className="p-3 text-xs font-semibold text-red-800 bg-red-50 rounded-md border border-red-200 flex items-center gap-1.5">
                  <AlertCircleIcon className="w-4 h-4 shrink-0 text-red-600" />
                  {transferError}
                </div>
              )}
              <p className="font-medium">
                Transferring: {transferringEmployee.name} (
                {transferringEmployee.penNumber || "N/A"})
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Current Unit: {transferringEmployee.currentUnit}
              </p>
              {currentUser?.role === "admin" && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2 mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Administrative Control Protocol</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSingleTransferMode("direct")}
                      className={`px-3 py-2 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        singleTransferMode === "direct"
                          ? "bg-amber-500 text-slate-900 border-amber-600 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ⚡ Direct Apply
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleTransferMode("unit-accepted")}
                      className={`px-3 py-2 text-[11px] font-bold rounded flex items-center justify-center gap-1.5 transition-all border ${
                        singleTransferMode === "unit-accepted"
                          ? "bg-sky-500 text-white border-sky-600 shadow-sm"
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      ⏳ Pending Unit
                    </button>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                   <TargetIcon className="w-3.5 h-3.5 text-red-500" /> Target Unit *
                </label>
                <Select
                  required
                  value={transferTargetUnit}
                  onValueChange={setTransferTargetUnit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Destination Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {(allUnits && allUnits.length > 0 ? allUnits : units).map((u) => (
                      <SelectItem key={u.id} value={u.name}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Date of Entry at Target Unit (Optional)
                </label>
                <Input
                  type="date"
                  value={transferTargetDate}
                  onChange={(e) => setTransferTargetDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Transfer Reason *
                </label>
                <Input
                  required
                  type="text"
                  placeholder="Enter reason for transfer (e.g., Mutual Request, Administrative, Medical)"
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferringEmployee(null);
                    setTransferReason("");
                    setTransferError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Confirm Transfer</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Transfer Modal */}
      {isBulkTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-card text-card-foreground rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  ⚡ Bulk Transfer Administration
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Transfer multiple employees across different units simultaneously.
                </p>
              </div>
              <button
                className="text-slate-400 hover:text-slate-700 font-semibold text-2xl leading-none"
                onClick={() => setIsBulkTransferModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleBulkTransferSubmit}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {/* Transfer Mode Radio Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">
                  Select Bulk Transfer Protocol
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Direct mode */}
                  <label
                    className={`p-3 rounded-lg border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                      bulkTransferMode === "direct"
                        ? "border-amber-500 bg-amber-50/20"
                        : "border-slate-105 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bulk_mode"
                        checked={bulkTransferMode === "direct"}
                        onChange={() => setBulkTransferMode("direct")}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        ⚡ Direct Bypass Transfer
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal pl-5">
                      Instantly relocates employees to the target unit. Bypasses all approval queues.
                    </span>
                  </label>

                  {/* Pending mode */}
                  <label
                    className={`p-3 rounded-lg border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                      bulkTransferMode === "unit-accepted"
                        ? "border-sky-500 bg-sky-50/20"
                        : "border-slate-105 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="bulk_mode"
                        checked={bulkTransferMode === "unit-accepted"}
                        onChange={() => setBulkTransferMode("unit-accepted")}
                        className="text-sky-600 focus:ring-sky-500"
                      />
                      <span className="font-bold text-xs text-slate-800">
                        ⏳ Unit Accepted Transfer
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 leading-normal pl-5">
                      Initiates pending requests. The destination unit must review and click "Accept" to finalize.
                    </span>
                  </label>
                </div>
              </div>

              {/* Guide card */}
              <div className="bg-slate-50 border p-3 rounded-lg text-[11px] leading-relaxed text-slate-600">
                <p className="font-bold text-slate-700 mb-1 flex items-center gap-1">
                  📋 CSV Template Structure:
                </p>
                <p className="font-mono bg-white border px-2 py-1 rounded select-all mb-2 text-slate-805">
                  penNumber,targetUnit,targetDate,reason
                </p>
                <ul className="list-disc pl-4 space-y-1 text-slate-550">
                  <li><strong>penNumber</strong>: 6-digit identification PEN (Required).</li>
                  <li><strong>targetUnit</strong>: Name of destination unit / depot (Required).</li>
                  <li><strong>targetDate</strong>: Scheduled date (YYYY-MM-DD, Optional, defaults to today).</li>
                  <li><strong>reason</strong>: Purpose of relocation or order remarks (Optional).</li>
                </ul>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Upload CSV File
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="link"
                      className="p-0 h-auto text-[11px]"
                      onClick={() =>
                        downloadCsvTemplate(
                          "bulk_transfer_template.csv",
                          "penNumber,targetUnit,targetDate,reason\n900012,Pappanamcode,2026-06-01,Administrative Transfer",
                        )
                      }
                    >
                      <DownloadIcon className="w-3 h-3 mr-1" /> Download Template
                    </Button>
                  </div>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100/50 transition-all group relative">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => handleCSVFileSelect(e, setBulkTransferCsvText)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <ArrowRightLeftIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className="text-xs font-bold text-slate-700">
                      {bulkTransferCsvText ? "✅ Transfer File Loaded" : "Click to select Bulk Transfer CSV"}
                    </p>
                  </div>
                </div>
                {bulkTransferCsvText && (
                  <div className="mt-4 p-3 bg-slate-100/50 border border-slate-200 rounded-lg">
                    <pre className="text-[10px] text-slate-600 font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {bulkTransferCsvText.split('\n').slice(0, 2).join('\n')}
                    </pre>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-2">
                  Ensure target unit names match perfectly with the unit names registered in Depot Logistics.
                </p>
              </div>

              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button
                  variant="outline"
                  type="button"
                  className="text-xs h-9"
                  onClick={() => setIsBulkTransferModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className={`text-xs h-9 font-semibold text-slate-950 ${
                    bulkTransferMode === "direct" 
                      ? "bg-amber-500 hover:bg-amber-400" 
                      : "bg-sky-500 hover:bg-sky-400"
                  }`}
                >
                  {bulkTransferMode === "direct" ? "⚡ Apply Direct Transfers" : "⏳ Initiate Inbound Requests"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Strength Modal */}
      {isBulkStrengthModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Bulk Upload Sanctioned Strength
              </h2>
              <button
                className="text-muted-foreground hover:text-foreground font-bold"
                onClick={() => setIsBulkStrengthModalOpen(false)}
              >
                &times;
              </button>
            </div>
            <form
              onSubmit={handleBulkStrengthSubmit}
              className="px-6 py-4 space-y-4"
            >
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium">
                    Upload CSV File
                  </label>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto text-xs"
                    onClick={() =>
                      downloadCsvTemplate(
                        "bulk_strength_template.csv",
                        "unitName,category,perm strength,badali strength\nThiruvananthapuram City,Mechanic,12,3\nThiruvananthapuram City,Assistant,6,1",
                      )
                    }
                  >
                    <DownloadIcon className="w-3 h-3 mr-1" /> Download Template
                  </Button>
                </div>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 hover:bg-slate-100/50 transition-all group relative">
                  <input
                    type="file"
                    accept=".csv"
                    required
                    onChange={(e) => handleCSVFileSelect(e, setBulkStrengthCsvText)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                      <TargetIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-700">
                      {bulkStrengthCsvText ? "✅ Strength Data Loaded" : "Click to select Strength CSV"}
                    </p>
                  </div>
                </div>
                {bulkStrengthCsvText && (
                  <div className="mt-4 p-3 bg-slate-100/50 border border-slate-200 rounded-lg">
                    <pre className="text-[10px] text-slate-600 font-mono overflow-hidden whitespace-nowrap overflow-ellipsis">
                      {bulkStrengthCsvText.split('\n').slice(0, 2).join('\n')}
                    </pre>
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Please include header row. Columns: Unit Name, Category, Perm
                  Strength, [Optional: Badali Strength].
                </p>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setIsBulkStrengthModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Upload Strength Data</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Work Arrangement Modal */}
      {isWAModalOpen && waEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card text-card-foreground rounded-lg shadow-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-muted/50">
              <h2 className="text-xl font-semibold">Assign Work Arrangement</h2>
              <button
                className="text-muted-foreground hover:text-foreground font-bold"
                onClick={() => {
                  setIsWAModalOpen(false);
                  setWaEmployee(null);
                }}
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleWASubmit} className="px-6 py-4 space-y-4">
              <div className="text-sm border-b pb-4 mb-4">
                Assigning <strong>{waEmployee.name}</strong> (PEN:{" "}
                {waEmployee.penNumber})<br />
                Parent Unit:{" "}
                <span className="font-semibold">{waEmployee.currentUnit}</span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Target Unit (WA) *
                  </label>
                  <Select
                    required
                    value={waTargetUnit}
                    onValueChange={setWaTargetUnit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Target Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((u) => (
                        <SelectItem key={u.id} value={u.name}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      From Date *
                    </label>
                    <Input
                      required
                      type="date"
                      value={waFromDate}
                      onChange={(e) => setWaFromDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      To Date *
                    </label>
                    <Input
                      required
                      type="date"
                      value={waToDate}
                      onChange={(e) => setWaToDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Reason *
                  </label>
                  <Input
                    required
                    value={waReason}
                    onChange={(e) => setWaReason(e.target.value)}
                    placeholder="e.g. Temporary Shortage"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Order Number
                  </label>
                  <Input
                    value={waOrderNo}
                    onChange={(e) => setWaOrderNo(e.target.value)}
                    placeholder="e.g. WA/2026/01"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-4 gap-3 border-t mt-6">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsWAModalOpen(false);
                    setWaEmployee(null);
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">Assign arrangement</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drill-Down Dialog */}
      <Dialog open={!!activeDrillDown} onOpenChange={(open) => !open && setActiveDrillDown(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-amber-600" />
              Staff Drill-down: {activeDrillDown?.unitName}
            </DialogTitle>
            <DialogDescription>
              Showing staff members currently contributing to actual strength for {activeDrillDown?.category}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>PEN</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Current Unit</TableHead>
                  <TableHead>WA/Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeDrillDown?.employeeIds.map((id, idx) => {
                  const emp = employees.find(e => e.id === id);
                  if (!emp) return null;
                  return (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono text-[10px] text-gray-500">{idx + 1}</TableCell>
                      <TableCell className="font-semibold">{emp.penNumber}</TableCell>
                      <TableCell>{emp.name}</TableCell>
                      <TableCell>{emp.currentUnit}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1 text-[10px]">
                          {emp.workArrangementUnit && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              WA to {emp.workArrangementUnit}
                            </Badge>
                          )}
                          {emp.pendingTransfer && (
                            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                              Pending: {emp.pendingTransfer.targetUnit}
                            </Badge>
                          )}
                          {!emp.workArrangementUnit && !emp.pendingTransfer && <span className="text-gray-400 font-mono">posted</span>}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button onClick={() => setActiveDrillDown(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
