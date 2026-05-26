import React, { useState, useEffect } from "react";
import { 
  Plus as PlusIcon,
  Trash as TrashIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  ShieldCheck as ShieldCheckIcon,
  User as UserIcon,
  RefreshCw as RefreshCwIcon,
  AlertCircle as CircleAlertIcon,
  Edit as Edit2Icon,
  X as XIcon,
  Save as SaveIcon,
  ClipboardCopy as ClipboardCopyIcon,
  Download as DownloadIcon,
  Building as BuildingIcon,
  ListCollapse as ListCollapseIcon,
  Search as SearchIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AdminSettingsProps {
  units: any[];
  getAuthHeaders: () => Record<string, string>;
  onRefresh?: () => void;
}

const DISTRICT_LIST = [
  "Thiruvananthapuram",
  "Kollam",
  "Pathanamthitta",
  "Alappuzha",
  "Kottayam",
  "Idukki",
  "Ernakulam",
  "Thrissur",
  "Palakkad",
  "Malappuram",
  "Kozhikode",
  "Wayanad",
  "Kannur",
  "Kasaragod",
  "Other"
];

export function AdminSettings({ units, getAuthHeaders, onRefresh }: AdminSettingsProps) {
  const [activeSubTab, setActiveSubTab] = useState<"logins" | "depots">("logins");
  const [logins, setLogins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New login state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "unit">("unit");
  const [canEdit, setCanEdit] = useState(true);
  const [canTransfer, setCanTransfer] = useState(true);
  const [allowedUnits, setAllowedUnits] = useState<string[]>([]);
  const [unitSearch, setUnitSearch] = useState("");

  // Bulk login state
  const [bulkText, setBulkText] = useState("");
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Inline Logins Edit Mode state
  const [editingLoginId, setEditingLoginId] = useState<string | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "unit">("unit");
  const [editCanEdit, setEditCanEdit] = useState(true);
  const [editCanTransfer, setEditCanTransfer] = useState(true);
  const [editAllowedUnits, setEditAllowedUnits] = useState<string[]>([]);
  const [editUnitSearch, setEditUnitSearch] = useState("");
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    "Thiruvananthapuram": true
  });

  // Depots/Units editing state
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const [editUnitDistrict, setEditUnitDistrict] = useState("");
  const [editUnitType, setEditUnitType] = useState<"depot" | "workshop" | "sub_depot" | "operating_centre">("depot");
  const [editUnitAssociatedDepot, setEditUnitAssociatedDepot] = useState("");

  // New Unit Creation state
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitDistrict, setNewUnitDistrict] = useState("Thiruvananthapuram");
  const [newUnitType, setNewUnitType] = useState<"depot" | "workshop" | "sub_depot" | "operating_centre">("depot");
  const [newUnitAssociatedDepot, setNewUnitAssociatedDepot] = useState("");
  const [creatingUnit, setCreatingUnit] = useState(false);
  const [unitLogisticsSearch, setUnitLogisticsSearch] = useState("");
  const [loginRegistrySearch, setLoginRegistrySearch] = useState("");

  // Standard derivation helpers to display nice defaults
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
    return "Other";
  };

  const toggleDistrict = (d: string) => {
    setExpandedDistricts(prev => ({ ...prev, [d]: !prev[d] }));
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

  const fetchLogins = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/logins", {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setLogins(data);
      } else {
        const errJson = await res.json().catch(() => ({ error: "Failed to fetch logins" }));
        setError(errJson.error || "Permission denied. Only admins can view logins.");
      }
    } catch (e) {
      setError("Network error fetching login credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogins();
  }, []);

  const handleCreateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanUsername = username.replace(/\s+/g, "");
    if (!cleanUsername) {
      setError("Username is required and cannot contain spaces");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      const res = await fetch("/api/logins", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: cleanUsername,
          password,
          role,
          allowedUnits: role === "admin" ? ["*"] : allowedUnits,
          canEdit,
          canTransfer,
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Login account for "${cleanUsername}" created successfully!`);
        setUsername("");
        setPassword("");
        setAllowedUnits([]);
        setRole("unit");
        setCanEdit(true);
        setCanTransfer(true);
        fetchLogins();
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to create unit login.");
      }
    } catch (e) {
      setError("Network error failed to save changes.");
    }
  };

  const handleDeleteLogin = async (id: string, usernameStr: string) => {
    if (id === "admin_default") {
      alert("The default system admin account cannot be deleted to prevent permanent lockout.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete login for "${usernameStr}"?`)) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/logins/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setSuccessMessage(`Login for "${usernameStr}" deleted.`);
        fetchLogins();
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to delete login.");
      }
    } catch (e) {
      setError("Network error failed to delete.");
    }
  };

  const handleTogglePermission = async (item: any, field: "canEdit" | "canTransfer") => {
    setError(null);
    setSuccessMessage(null);
    try {
      const nextVal = !item[field];
      const res = await fetch(`/api/logins/${item.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          [field]: nextVal
        }),
      });
      if (res.ok) {
        setSuccessMessage(`Updated login permission for "${item.username}".`);
        fetchLogins();
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to update permission.");
      }
    } catch (e) {
      setError("Failed to coordinate updates with server.");
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingLoginId(item.id);
    setEditUsername(item.username);
    setEditPassword(item.password);
    setEditRole(item.role || "unit");
    setEditCanEdit(item.canEdit !== false);
    setEditCanTransfer(item.canTransfer !== false);
    setEditAllowedUnits(item.allowedUnits || []);
  };

  const handleSaveEdit = async (id: string) => {
    setError(null);
    setSuccessMessage(null);
    const cleanUsername = editUsername.replace(/\s+/g, "");
    if (!cleanUsername) {
      setError("Username cannot be empty");
      return;
    }
    try {
      const res = await fetch(`/api/logins/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          username: cleanUsername,
          password: editPassword,
          role: editRole,
          allowedUnits: editRole === "admin" ? ["*"] : editAllowedUnits,
          canEdit: editCanEdit,
          canTransfer: editCanTransfer
        }),
      });

      if (res.ok) {
        setSuccessMessage("Credentials updated successfully.");
        setEditingLoginId(null);
        fetchLogins();
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to update account.");
      }
    } catch (e) {
      setError("Network conflict communicating changes.");
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!newUnitName.trim()) {
      setError("Depot/Unit Name is required");
      return;
    }
    setCreatingUnit(true);
    try {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: newUnitName.trim(),
          district: newUnitDistrict,
          type: newUnitType,
          associatedDepot: (newUnitType === "operating_centre" || newUnitType === "sub_depot") ? newUnitAssociatedDepot : ""
        }),
      });

      if (res.ok) {
        setSuccessMessage(`New unit "${newUnitName}" added successfully.`);
        setNewUnitName("");
        setNewUnitAssociatedDepot("");
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to create unit.");
      }
    } catch (el) {
      setError("Failed to create unit on server.");
    } finally {
      setCreatingUnit(false);
    }
  };

  const handleSaveUnitSettings = async (unit: any) => {
    setError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/units/${unit.id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          district: editUnitDistrict || getUnitDistrict(unit),
          type: editUnitType || getUnitType(unit),
          associatedDepot: (editUnitType === "operating_centre" || editUnitType === "sub_depot") ? editUnitAssociatedDepot : ""
        }),
      });
      if (res.ok) {
        setSuccessMessage(`Depot "${unit.name}" parameters saved successfully.`);
        setEditingUnitId(null);
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setError(errJson.error || "Failed to update unit logistics settings.");
      }
    } catch (e) {
      setError("Failed to save unit logistic coordinate values.");
    }
  };

  const handleStartEditUnit = (u: any) => {
    setEditingUnitId(u.id);
    setEditUnitDistrict(getUnitDistrict(u));
    setEditUnitType(getUnitType(u));
    setEditUnitAssociatedDepot(u.associatedDepot || "");
  };

  // Bulk login parsing
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError(null);
    setSuccessMessage(null);

    if (!bulkText.trim()) {
      setBulkError("Please paste some bulk logins first");
      return;
    }

    const lines = bulkText.split("\n");
    const bulkList: any[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      if (trimmed.toLowerCase().startsWith("username,password") || trimmed.toLowerCase().startsWith("username\tpassword")) {
        return;
      }

      let parts: string[] = [];
      if (trimmed.includes("\t")) {
        parts = trimmed.split("\t");
      } else if (trimmed.includes(";")) {
        parts = trimmed.split(";");
      } else if (trimmed.includes("|")) {
        parts = trimmed.split("|");
      } else {
        parts = trimmed.split(",");
      }

      const rawU = parts[0]?.trim();
      const cleanU = rawU ? rawU.replace(/\s+/g, "") : "";
      const rawP = parts[1]?.trim();
      
      if (!cleanU || !rawP) return;

      let targetUnits: string[] = [];
      if (parts[2]) {
        targetUnits = parts[2]
          .split("/")
          .map((u) => u.trim())
          .filter(Boolean);
      }

      const canE = parts[3] ? parts[3].toLowerCase() !== "false" : true;
      const canT = parts[4] ? parts[4].toLowerCase() !== "false" : true;

      bulkList.push({
        username: cleanU,
        password: rawP,
        role: "unit",
        allowedUnits: targetUnits,
        canEdit: canE,
        canTransfer: canT,
      });
    });

    if (bulkList.length === 0) {
      setBulkError("Could not parse any valid logins. Please double-check formatting: username,password,depots (e.g. Unit A/Unit B)");
      return;
    }

    try {
      const res = await fetch("/api/logins/bulk", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ bulkList }),
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessMessage(`Successfully imported ${data.addedCount} new logins!`);
        setBulkText("");
        fetchLogins();
        if (onRefresh) onRefresh();
      } else {
        const errJson = await res.json();
        setBulkError(errJson.error || "Failed to process bulk import.");
      }
    } catch (e) {
      setBulkError("Network error occurred during bulk import.");
    }
  };

  const copyTemplateToClipboard = () => {
    const templateText = "username,password,depots,canEdit,canTransfer\ntvm_clerk,password123,Thiruvananthapuram City/Thiruvananthapuram Central,true,true\nernakulam_clerk,ernapass889,Ernakulam,true,false\nworkshop_clerk,workshoppass,Central Workshop,false,false";
    navigator.clipboard.writeText(templateText);
    alert("Template copied to clipboard!");
  };

  const downloadCsvTemplateFile = () => {
    const content = "username,password,depots,canEdit,canTransfer\ntvm_clerk,password123,Thiruvananthapuram City/Thiruvananthapuram Central,true,true\nernakulam_clerk,ernapass889,Ernakulam,true,false\nworkshop_clerk,workshoppass,Central Workshop,false,false";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bulk_credentials_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleUnitSelection = (unitName: string) => {
    if (allowedUnits.includes(unitName)) {
      setAllowedUnits(allowedUnits.filter((u) => u !== unitName));
    } else {
      setAllowedUnits([...allowedUnits, unitName]);
    }
  };

  const toggleEditUnitSelection = (unitName: string) => {
    if (editAllowedUnits.includes(unitName)) {
      setEditAllowedUnits(editAllowedUnits.filter((u) => u !== unitName));
    } else {
      setEditAllowedUnits([...editAllowedUnits, unitName]);
    }
  };

  const filteredUnitsList = units.filter((u) =>
    u.name.toLowerCase().includes(unitSearch.toLowerCase())
  );

  const filteredEditUnitsList = units.filter((u) =>
    u.name.toLowerCase().includes(editUnitSearch.toLowerCase())
  );

  // List of main depots to associate with operating centres
  const mainDepotsList = units.filter(u => getUnitType(u) === "depot");

  return (
    <div className="space-y-6">
      {/* Dynamic Sub Tabs Panel */}
      <div className="flex border-b border-gray-200 bg-white/50 backdrop-blur-sm rounded-t-lg sticky top-0 z-10">
        <button
          onClick={() => setActiveSubTab("logins")}
          className={`px-6 py-3.5 font-bold text-xs uppercase tracking-widest transition-all focus:outline-none flex items-center gap-2 ${
            activeSubTab === "logins"
              ? "border-b-2 border-slate-900 text-slate-900 bg-amber-50/50"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
          }`}
        >
          <ShieldCheckIcon className={`w-4 h-4 ${activeSubTab === "logins" ? "text-amber-600" : "text-slate-300"}`} />
          User Permissions
        </button>
        <button
          onClick={() => setActiveSubTab("depots")}
          className={`px-6 py-3.5 font-bold text-xs uppercase tracking-widest transition-all focus:outline-none flex items-center gap-2 ${
            activeSubTab === "depots"
              ? "border-b-2 border-slate-900 text-slate-900 bg-amber-50/50"
              : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
          }`}
        >
          <BuildingIcon className={`w-4 h-4 ${activeSubTab === "depots" ? "text-amber-600" : "text-slate-300"}`} />
          Depot Logistics
        </button>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-3">
          <CircleAlertIcon className="w-5 h-5 text-red-600 shrink-0" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}
      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 rounded-lg flex items-center gap-3">
          <CheckIcon className="w-5 h-5 text-green-600 shrink-0" />
          <div className="text-sm font-medium">{successMessage}</div>
        </div>
      )}

      {activeSubTab === "logins" && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* CREATE INDIVIDUAL UNIT LOGIN CARD */}
            <Card className="lg:col-span-4 h-fit bg-card border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Unit Credentials</CardTitle>
                <CardDescription>
                  Add secure operational profile for specific depots or units.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateLogin} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                      Username *
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="e.g. tvm_city"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/\s+/g, ""))}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                      Initial Password *
                    </label>
                    <Input
                      required
                      type="text"
                      placeholder="e.g. password123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block uppercase tracking-wider">
                      Authorized Depot Access (Search & Select)
                    </label>
                    <div className="relative mb-2">
                       <Input
                         placeholder="Search units to assign..."
                         className="h-8 text-xs pl-8"
                         value={unitSearch}
                         onChange={(e) => setUnitSearch(e.target.value)}
                       />
                       <SearchIcon className="w-3 h-3 absolute left-2.5 top-2.5 text-slate-400" />
                    </div>
                    <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-slate-50 space-y-1">
                      {units.filter(u => u.name.toLowerCase().includes(unitSearch.toLowerCase())).map(u => (
                        <label key={u.id} className="flex items-center gap-2 text-xs p-1 hover:bg-white rounded cursor-pointer">
                          <input
                             type="checkbox"
                             checked={allowedUnits.includes(u.name)}
                             onChange={() => toggleUnitSelection(u.name)}
                             className="rounded border-gray-300 text-amber-500"
                          />
                          <span className={allowedUnits.includes(u.name) ? "font-bold text-amber-900" : "text-slate-600"}>
                            {u.name}
                          </span>
                        </label>
                      ))}
                    </div>
                    {allowedUnits.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                         {allowedUnits.map(un => (
                           <Badge key={un} className="bg-amber-100 text-amber-800 text-[9px] px-1.5 py-0 flex items-center gap-1">
                             {un}
                             <button type="button" onClick={() => toggleUnitSelection(un)}><XIcon className="w-2.5 h-2.5" /></button>
                           </Badge>
                         ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Access Privilege Switches</span>
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={true} // Hardcoded view for simplicity in creation
                          disabled
                          className="rounded border-gray-300 text-amber-500 h-4 w-4"
                        />
                        Can View Own Depot Data
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={canEdit}
                          onChange={(e) => setCanEdit(e.target.checked)}
                          className="rounded border-gray-300 text-amber-500 h-4 w-4"
                        />
                        Can Create/Edit/Restore Own Records
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="checkbox"
                          checked={canTransfer}
                          onChange={(e) => setCanTransfer(e.target.checked)}
                          className="rounded border-gray-300 text-amber-500 h-4 w-4"
                        />
                        Can Mutate / Transfer Roster Profiles
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-5 rounded-md shadow-sm uppercase tracking-wide">
                    Provision Unit Login
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* BULK CREATION CARD */}
            <Card className="lg:col-span-4 h-fit bg-card border shadow-sm">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Bulk Upload Credentials</CardTitle>
                  <CardDescription>
                    Provide CSV format to instantiate bulk logins automatically.
                  </CardDescription>
                </div>
                <button onClick={downloadCsvTemplateFile} className="text-[10px] font-bold text-amber-600 underline hover:text-amber-700">Template CSV</button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">CSV Raw Input Representation</span>
                  <textarea
                    className="flex min-h-[160px] w-full rounded-md border border-input bg-slate-50/50 px-3 py-2 text-xs font-mono text-slate-600"
                    placeholder="username,password,unitId,canView,canEdit,canTransfer&#10;depot_xyz,xyzPass123,Tvm City,true,true,true"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                  />
                </div>
                {bulkError && <p className="text-[10px] text-rose-600 font-bold">{bulkError}</p>}
                
                <Button onClick={handleBulkSubmit} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase py-2">
                  Upload Bulk Credentials
                </Button>
              </CardContent>
            </Card>

            {/* ROSTER DATABASE BACKUP CARD (as seen in screenshot) */}
            <Card className="lg:col-span-4 h-fit bg-card border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Roster Database Backup & Isolation</CardTitle>
                <CardDescription>
                  Secure persistent recovery system, export schemas, and hot restoration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg flex gap-3">
                  <div className="text-xl">🗄️</div>
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-800">File System Database (db.json)</h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Every employee pipeline profile, auditing log, and operational account is synchronized in high-performance local block storage automatically.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-none font-bold uppercase text-[11px] h-10"
                    onClick={() => {
                        const blob = new Blob([JSON.stringify({ logins, units, timestamp: new Date().toISOString() }, null, 2)], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `ksrtc_roster_snapshot_${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                    }}
                  >
                    <DownloadIcon className="w-3.5 h-3.5 mr-2" /> Export Snapshot Copy (JSON)
                  </Button>
                  <Button variant="outline" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border-none font-bold uppercase text-[11px] h-10">
                    <RefreshCwIcon className="w-3.5 h-3.5 mr-2" /> Recover Snapshot (.JSON)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ADMIN CONSOLE LOGINS */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b py-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800">Administrator Console Credentials</CardTitle>
                <CardDescription className="text-xs">Universal high-level access accounts permitted for state-wide policy changes.</CardDescription>
              </div>
              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 uppercase text-[10px]">Secure Admin Layer</Badge>
            </CardHeader>
            <Table className="text-xs">
              <TableHeader className="bg-slate-50/30">
                <TableRow>
                  <TableHead className="w-12">No.</TableHead>
                  <TableHead>Username / Assigned Scope</TableHead>
                  <TableHead>Control Class</TableHead>
                  <TableHead className="text-right">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logins.filter(l => l.role === "admin").map((lg, idx) => (
                  <TableRow key={lg.id} className="hover:bg-slate-50/50">
                    <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{lg.username}</span>
                        <span className="text-[10px] text-slate-500">Privilege: Universal Master</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase text-[9px] font-bold">Full Protocol Control</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-indigo-600" onClick={() => handleStartEdit(lg)}><Edit2Icon className="h-3.5 h-3.5" /></Button>
                        {lg.id !== 'admin_default' && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-500" onClick={() => handleDeleteLogin(lg.id, lg.username)}><TrashIcon className="h-3.5 h-3.5" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* UNIT CONSOLE LOGINS WITH SEARCH */}
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b py-3 space-y-0">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-800">Active Operational Unit Logins ({logins.filter(l => l.role === "unit").length})</CardTitle>
                    <CardDescription className="text-xs">Below is the complete registry of active accounts permitted to login.</CardDescription>
                  </div>
                  <div className="relative w-full md:w-72">
                    <Input 
                        placeholder="🔍 Search Unit Username or Assigned Depot..." 
                        className="h-9 text-xs pl-8 bg-white"
                        value={loginRegistrySearch}
                        onChange={(e) => setLoginRegistrySearch(e.target.value)}
                    />
                    <div className="absolute left-2.5 top-2.5 text-slate-400">
                        {/* Search icon placeholder handled by emoji or lucide if needed */}
                    </div>
                  </div>
               </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50/30">
                  <TableRow>
                    <TableHead className="w-12 uppercase text-[10px] font-bold">No.</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Username / Assigned Unit</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Password</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Can View Own Data</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Can Create/Edit/Restore</TableHead>
                    <TableHead className="uppercase text-[10px] font-bold">Can Do Transfers</TableHead>
                    <TableHead className="text-right uppercase text-[10px] font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logins
                    .filter(l => l.role === "unit")
                    .filter(l => {
                        const search = loginRegistrySearch.toLowerCase();
                        return l.username.toLowerCase().includes(search) || 
                               (l.allowedUnits || []).some((u: string) => u.toLowerCase().includes(search));
                    })
                    .map((lg, idx) => {
                      const isEditing = editingLoginId === lg.id;
                      return (
                        <TableRow key={lg.id} className="hover:bg-slate-50/50">
                          {isEditing ? (
                              <TableCell colSpan={7} className="bg-amber-50/30 p-4">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-2 font-bold text-amber-900 border-b border-amber-100 pb-1.5 mb-2">
                                     <span>🛠️ MODIFICATION MODE:</span>
                                     <span className="bg-white px-2 py-0.5 rounded shadow-sm">{lg.username}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Username</label>
                                        <Input className="h-8 text-xs font-mono" value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                                     </div>
                                     <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
                                        <Input className="h-8 text-xs font-mono" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} />
                                     </div>
                                     <div className="col-span-2 space-y-1">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Permitted Boundaries ({editAllowedUnits.length})</label>
                                        <select 
                                            className="w-full h-8 rounded border border-input text-xs bg-white px-2"
                                            value={editAllowedUnits.length === 1 ? editAllowedUnits[0] : ""}
                                            onChange={(e) => setEditAllowedUnits([e.target.value])}
                                        >
                                            <option value="">-- Switch Assigned Depot --</option>
                                            {units.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                                        </select>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4 pt-2">
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                         <input type="checkbox" checked={editCanEdit} onChange={(e) => setEditCanEdit(e.target.checked)} />
                                         Can Create/Edit
                                      </label>
                                      <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                         <input type="checkbox" checked={editCanTransfer} onChange={(e) => setEditCanTransfer(e.target.checked)} />
                                         Can Do Transfers
                                      </label>
                                      <div className="ml-auto flex gap-2">
                                         <Button variant="ghost" size="sm" onClick={() => setEditingLoginId(null)}>Cancel</Button>
                                         <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => handleSaveEdit(lg.id)}>Save Changes</Button>
                                      </div>
                                  </div>
                                </div>
                              </TableCell>
                          ) : (
                            <>
                              <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900">{lg.username}</span>
                                  <span className="text-[9px] text-slate-500 font-medium">Authorized depot: <span className="text-amber-800">{lg.allowedUnits?.includes("*") ? "All" : lg.allowedUnits?.join(", ") || "None assigned"}</span></span>
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-slate-500">{lg.password}</TableCell>
                              <TableCell>
                                <Badge className="bg-emerald-50 text-emerald-700 border-none uppercase text-[9px] font-bold">Allowed</Badge>
                              </TableCell>
                              <TableCell>
                                {lg.canEdit !== false ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-none uppercase text-[9px] font-bold" onClick={() => handleTogglePermission(lg, "canEdit")}>Allowed</Badge>
                                ) : (
                                  <Badge className="bg-rose-50 text-rose-700 border-none uppercase text-[9px] font-bold" onClick={() => handleTogglePermission(lg, "canEdit")}>Revoked</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {lg.canTransfer !== false ? (
                                  <Badge className="bg-emerald-50 text-emerald-700 border-none uppercase text-[9px] font-bold" onClick={() => handleTogglePermission(lg, "canTransfer")}>Allowed</Badge>
                                ) : (
                                  <Badge className="bg-rose-50 text-rose-700 border-none uppercase text-[9px] font-bold" onClick={() => handleTogglePermission(lg, "canTransfer")}>Revoked</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex gap-2 justify-end">
                                    <button onClick={() => handleStartEdit(lg)} className="text-indigo-600 hover:underline font-bold">Edit</button>
                                    <button onClick={() => handleDeleteLogin(lg.id, lg.username)} className="text-rose-600 border border-rose-200 px-2 py-0.5 rounded hover:bg-rose-50">Revoke</button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      )}

      {activeSubTab === "depots" && (
        <div className="grid gap-6 lg:grid-cols-12">
          {/* SIDE PANEL: CREATOR & HIERARCHY */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="h-fit bg-card border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Register New Unit / Depot</CardTitle>
                <CardDescription>
                  Add new operational hubs, workshops, or sub-reporting operating centres.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateUnit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">Unit/Depot Name</label>
                    <Input
                      required
                      type="text"
                      placeholder="e.g. Pappanamcode"
                      value={newUnitName}
                      onChange={(e) => setNewUnitName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">District Group</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-ring"
                      value={newUnitDistrict}
                      onChange={(e) => setNewUnitDistrict(e.target.value)}
                    >
                      {DISTRICT_LIST.map((dist) => (
                        <option key={dist} value={dist}>{dist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">Unit Type</label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-ring"
                      value={newUnitType}
                      onChange={(e) => {
                        const t = e.target.value as any;
                        setNewUnitType(t);
                      }}
                    >
                      <option value="depot">Main Depot / Primary Unit</option>
                      <option value="workshop">Regional Workshop / Central Workshop</option>
                      <option value="sub_depot">Sub Depot</option>
                      <option value="operating_centre">Operating Centre</option>
                    </select>
                  </div>

                  {(newUnitType === "operating_centre" || newUnitType === "sub_depot") && (
                    <div className="space-y-1 bg-emerald-50/50 p-2.5 border border-emerald-200 rounded-lg">
                      <label className="text-xs font-semibold text-emerald-800 block">🔗 Associated Main Depot (Join with)</label>
                      <p className="text-[10px] text-gray-500 mb-2 leading-tight">
                        We will merge this sub-reporting unit's personnel strength numbers into the selected main depot on collapse view.
                      </p>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-xs"
                        required
                        value={newUnitAssociatedDepot}
                        onChange={(e) => setNewUnitAssociatedDepot(e.target.value)}
                      >
                        <option value="">-- Choose Main Depot --</option>
                        {mainDepotsList.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <Button type="submit" disabled={creatingUnit} className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold mt-2">
                    <PlusIcon className="w-4 h-4 mr-1" /> Add New Unit
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* HIERARCHY TREE VIEWER */}
            <Card className="h-fit bg-card border shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-slate-800">
                  🗺️ Operational Hierarchy Explorer
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Visual layout of Districts, Main Depots, Sub-depots &amp; Operating Centres. Click districts to expand.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {DISTRICT_LIST.map((district) => {
                    const districtUnits = units.filter(u => getUnitDistrict(u) === district);
                    if (districtUnits.length === 0) return null;

                    const mainDepots = districtUnits.filter(u => getUnitType(u) === "depot");
                    const workshops = districtUnits.filter(u => getUnitType(u) === "workshop");
                    const unattached = districtUnits.filter(u => 
                      (getUnitType(u) === "sub_depot" || getUnitType(u) === "operating_centre") && 
                      (!u.associatedDepot || !units.some(p => p.name === u.associatedDepot))
                    );

                    const isExpanded = !!expandedDistricts[district];

                    return (
                      <div key={district} className="border border-slate-100 rounded-md overflow-hidden bg-slate-50/30">
                        <button
                          type="button"
                          onClick={() => toggleDistrict(district)}
                          className="w-full flex items-center justify-between p-2.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>📍 {district}</span>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-white/80 font-mono text-gray-500 border-gray-200 leading-none">
                              {districtUnits.length}
                            </Badge>
                          </div>
                          <span>{isExpanded ? "▲" : "▼"}</span>
                        </button>

                        {isExpanded && (
                          <div className="p-3 space-y-3 bg-white text-xs text-slate-600 font-sans border-t border-slate-50">
                            {/* Main Depots tree branch */}
                            {mainDepots.map((md) => {
                              const children = units.filter(
                                (ch) =>
                                  (getUnitType(ch) === "sub_depot" || getUnitType(ch) === "operating_centre") &&
                                  ch.associatedDepot === md.name
                              );

                              return (
                                <div key={md.id} className="space-y-1">
                                  <div 
                                    className="flex items-center gap-1 font-semibold text-slate-800 cursor-pointer hover:bg-indigo-50/50 p-1 rounded transition-all"
                                    onClick={() => {
                                      setUnitLogisticsSearch(md.name);
                                      handleStartEditUnit(md);
                                      document.getElementById("depot-logistic-classifications-card")?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    title="Click to search & edit this main depot"
                                  >
                                    <span>🏢</span>
                                    <span className="underline decoration-indigo-200 decoration-2">{md.name}</span>
                                    <span className="text-[9px] text-indigo-600 bg-indigo-50/60 px-1 rounded ml-auto scale-90 select-none">edit</span>
                                  </div>
                                  {children.length > 0 ? (
                                    <div className="pl-4 border-l border-slate-150 ml-2 space-y-1 pt-0.5 pb-1">
                                      {children.map((ch, chIdx) => {
                                        const isLast = chIdx === children.length - 1;
                                        const indicator = isLast ? "└──" : "├──";
                                        const isSubDepot = getUnitType(ch) === "sub_depot";
                                        return (
                                          <div 
                                            key={ch.id} 
                                            className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px] leading-relaxed cursor-pointer hover:bg-amber-50/50 p-1 rounded transition-all"
                                            onClick={() => {
                                              setUnitLogisticsSearch(ch.name);
                                              handleStartEditUnit(ch);
                                              document.getElementById("depot-logistic-classifications-card")?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            title="Click to search & edit this sub-unit"
                                          >
                                            <span className="text-gray-400 select-none">{indicator}</span>
                                            <span>{isSubDepot ? "🌿" : "🔗"}</span>
                                            <span className="font-semibold text-slate-700 underline decoration-amber-200">{ch.name}</span>
                                            <span className="text-[9px] text-gray-500 bg-gray-100/50 px-1 rounded ml-auto scale-90 select-none">
                                              edit
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <p className="text-[10px] text-gray-400 italic pl-5 leading-normal font-sans">
                                      No associated sub-depots / operating centres
                                    </p>
                                  )}
                                </div>
                              );
                            })}

                            {/* Workshops tree branch */}
                            {workshops.length > 0 && (
                              <div className="space-y-1 border-t border-slate-50 pt-1.5">
                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-sans">Workshops</div>
                                {workshops.map((w) => (
                                  <div 
                                    key={w.id} 
                                    className="flex items-center gap-1.5 pl-1.5 py-1 rounded cursor-pointer hover:bg-indigo-50/30 text-[11px] transition-all"
                                    onClick={() => {
                                      setUnitLogisticsSearch(w.name);
                                      handleStartEditUnit(w);
                                      document.getElementById("depot-logistic-classifications-card")?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    title="Click to search & edit this workshop"
                                  >
                                    <span>⚙️</span>
                                    <span className="font-semibold text-slate-700 underline decoration-indigo-200">{w.name}</span>
                                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1 rounded ml-auto scale-90 select-none">edit</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Unattached elements branch */}
                            {unattached.length > 0 && (
                              <div className="space-y-1 border-t border-slate-50 pt-1.5">
                                <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-sans">Unattached Sub-Units</div>
                                {unattached.map((un) => {
                                  const isSub = getUnitType(un) === "sub_depot";
                                  return (
                                    <div 
                                      key={un.id} 
                                      className="flex items-center gap-1.5 pl-1 text-[11px] cursor-pointer hover:bg-amber-50/50 p-1.5 rounded transition-all" 
                                      onClick={() => {
                                        setUnitLogisticsSearch(un.name);
                                        handleStartEditUnit(un);
                                        document.getElementById("depot-logistic-classifications-card")?.scrollIntoView({ behavior: 'smooth' });
                                      }}
                                      title="Click to search & edit this unattached unit and link to a main depot"
                                    >
                                      <span>⚠️</span>
                                      <span className="font-semibold text-slate-700 underline decoration-amber-200">{un.name}</span>
                                      <span className="text-[9px] text-amber-600 italic bg-amber-50 px-1 rounded ml-auto">
                                        fix link
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card id="depot-logistic-classifications-card" className="lg:col-span-8 h-fit bg-card border shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-slate-900 text-slate-100 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BuildingIcon className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold uppercase tracking-tight">Depot Registry Inventory</h3>
              </div>
              <div className="relative w-full md:w-64">
                 <SearchIcon className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                 <Input 
                   className="h-9 text-xs pl-9 bg-slate-800 border-slate-700 text-slate-200 focus:bg-slate-850" 
                   placeholder="Search units, districts, types..." 
                   value={unitLogisticsSearch}
                   onChange={(e) => setUnitLogisticsSearch(e.target.value)}
                 />
              </div>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto max-h-[600px]">
                <Table className="text-xs">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-12 uppercase text-[10px] font-bold">No.</TableHead>
                      <TableHead className="uppercase text-[10px] font-bold text-slate-700">Unit Metadata</TableHead>
                      <TableHead className="uppercase text-[10px] font-bold text-slate-700">District</TableHead>
                      <TableHead className="uppercase text-[10px] font-bold text-slate-700">Classification</TableHead>
                      <TableHead className="uppercase text-[10px] font-bold text-slate-700 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {units
                      .filter((u) => {
                        const search = unitLogisticsSearch.toLowerCase().trim();
                        if (!search) return true;
                        const dist = getUnitDistrict(u).toLowerCase();
                        const type = getUnitType(u).toLowerCase();
                        return (
                          u.name?.toLowerCase().includes(search) ||
                          dist.includes(search) ||
                          type.includes(search)
                        );
                      })
                      .map((u, index) => {
                      const isEditing = editingUnitId === u.id;
                      const district = getUnitDistrict(u);
                      const type = getUnitType(u);
                      return (
                        <TableRow key={u.id} className="hover:bg-slate-50/50">
                          <TableCell className="font-mono text-gray-400">{index + 1}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{u.name}</TableCell>
                          
                          {isEditing ? (
                            <>
                              <TableCell className="p-2">
                                <select
                                  className="flex h-8 rounded border border-input bg-white px-2 py-1 text-xs"
                                  value={editUnitDistrict}
                                  onChange={(e) => setEditUnitDistrict(e.target.value)}
                                >
                                  {DISTRICT_LIST.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </TableCell>
                              <TableCell className="p-2">
                                <select
                                  className="flex h-8 rounded border border-input bg-white px-2 py-1 text-xs"
                                  value={editUnitType}
                                  onChange={(e) => {
                                    const t = e.target.value as any;
                                    setEditUnitType(t);
                                  }}
                                >
                                  <option value="depot">Depot</option>
                                  <option value="workshop">Workshop</option>
                                  <option value="sub_depot">Sub Depot</option>
                                  <option value="operating_centre">Operating Centre</option>
                                </select>
                              </TableCell>
                              <TableCell className="p-2">
                                {editUnitType === "operating_centre" || editUnitType === "sub_depot" ? (
                                  <select
                                    className="flex h-8 rounded border border-input bg-white px-2 py-1 text-xs"
                                    value={editUnitAssociatedDepot}
                                    onChange={(e) => setEditUnitAssociatedDepot(e.target.value)}
                                  >
                                    <option value="">-- Choose Depot --</option>
                                    {mainDepotsList.filter(md => md.name !== u.name).map(md => (
                                      <option key={md.id} value={md.name}>{md.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <span className="text-gray-400 italic">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right p-2 whitespace-nowrap">
                                <div className="flex gap-1.5 justify-end">
                                  <Button size="icon" variant="outline" className="h-7 w-7 text-gray-500 hover:bg-slate-100" onClick={() => setEditingUnitId(null)}>
                                    <XIcon className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button size="icon" className="h-7 w-7 bg-emerald-600 text-white hover:bg-emerald-500" onClick={() => handleSaveUnitSettings(u)}>
                                    <CheckIcon className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell>
                                <Badge variant="outline" className="bg-slate-50 text-slate-800 font-medium">
                                  📍 {district}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {type === "workshop" ? (
                                  <Badge className="bg-indigo-100 text-indigo-800 border-none">⚙️ Workshop</Badge>
                                ) : type === "sub_depot" ? (
                                  <Badge className="bg-amber-100 text-amber-800 border-none">🌿 Sub Depot</Badge>
                                ) : type === "operating_centre" ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-none">🔗 Operating Centre</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-800 border-none">🏢 Main Depot</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {(type === "operating_centre" || type === "sub_depot") && u.associatedDepot ? (
                                  <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-emerald-50 max-w-fit px-2 py-1 rounded border border-emerald-100 font-medium">
                                    <span>Joined with:</span>
                                    <span className="font-bold text-emerald-800">{u.associatedDepot}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right p-2 whitespace-nowrap">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-indigo-600 hover:bg-slate-100"
                                  onClick={() => handleStartEditUnit(u)}
                                >
                                  <Edit2Icon className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
