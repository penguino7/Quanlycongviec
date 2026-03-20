import React, { useState, useEffect } from "react";
import {
  Database,
  RefreshCw,
  Save,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Columns,
  Calendar as CalendarIcon,
} from "lucide-react";
import DatePicker from "react-datepicker";
import { format, parse } from "date-fns";
import { isGasApiConfigured, sheetsApi } from "../services/gasApi";

type SheetApiAdapter = {
  getSheetNames: () => Promise<string[]>;
  getSheetHeaders: (sheetName: string) => Promise<string[]>;
  appendData: (sheetName: string, data: Record<string, unknown>) => Promise<boolean>;
  createSheet: (sheetName: string, headers: string[]) => Promise<boolean>;
};

const localSheetApi: SheetApiAdapter = {
  getSheetNames: async () => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const savedSheets = localStorage.getItem("mockSheets");
    if (savedSheets) return JSON.parse(savedSheets);
    const initialSheets = ["Cong viec", "Chi tieu", "Khach hang", "Du an"];
    localStorage.setItem("mockSheets", JSON.stringify(initialSheets));
    return initialSheets;
  },

  getSheetHeaders: async (sheetName: string) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    const savedHeaders = localStorage.getItem(`headers_${sheetName}`);
    if (savedHeaders) return JSON.parse(savedHeaders);

    const mockHeaders: Record<string, string[]> = {
      "Cong viec": ["Tieu de", "Mo ta", "Do uu tien", "Trang thai", "Ngay het han"],
      "Chi tieu": ["Ngay thang", "Hang muc", "So tien", "Ghi chu"],
      "Khach hang": ["Ten khach hang", "Email", "So dien thoai", "Trang thai", "Ngay tao"],
      "Du an": ["Ten du an", "Ngan sach", "Ngay bat dau", "Ngay ket thuc", "Trang thai"],
    };

    return mockHeaders[sheetName] || [];
  },

  appendData: async (_sheetName, data) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Local append data:", data);
    return true;
  },

  createSheet: async (sheetName, headers) => {
    await new Promise((resolve) => setTimeout(resolve, 250));
    const savedSheets = JSON.parse(localStorage.getItem("mockSheets") || "[]");
    if (!savedSheets.includes(sheetName)) {
      localStorage.setItem("mockSheets", JSON.stringify([...savedSheets, sheetName]));
    }
    localStorage.setItem(`headers_${sheetName}`, JSON.stringify(headers));
    return true;
  },
};

const remoteSheetApi: SheetApiAdapter = {
  getSheetNames: async () => {
    const response = await sheetsApi.list();
    return response.sheetNames;
  },
  getSheetHeaders: async (sheetName) => {
    const response = await sheetsApi.headers(sheetName);
    return response.headers;
  },
  appendData: async (sheetName, data) => {
    await sheetsApi.append({ sheetName, rowData: data });
    return true;
  },
  createSheet: async (sheetName, headers) => {
    await sheetsApi.create({ sheetName, headers });
    return true;
  },
};

const sheetApi = isGasApiConfigured() ? remoteSheetApi : localSheetApi;

const detectFieldType = (
  fieldName: string
): "date" | "number" | "select" | "text" => {
  const lowerName = fieldName.toLowerCase();
  if (
    lowerName.includes("ngay") ||
    lowerName.includes("han") ||
    lowerName.includes("date")
  )
    return "date";
  if (
    lowerName.includes("so") ||
    lowerName.includes("tien") ||
    lowerName.includes("ngan sach") ||
    lowerName.includes("number")
  )
    return "number";
  if (
    lowerName.includes("trang thai") ||
    lowerName.includes("do uu tien") ||
    lowerName.includes("status") ||
    lowerName.includes("priority")
  )
    return "select";
  return "text";
};

const getSelectOptions = (fieldName: string): string[] => {
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes("trang thai")) return ["Chua lam", "Dang lam", "Hoan thanh"];
  if (lowerName.includes("do uu tien")) return ["Thap", "Trung binh", "Cao"];
  return [];
};

export const SheetManager = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);
  const [showSelectDropdowns, setShowSelectDropdowns] = useState<Record<string, boolean>>({});

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState("");
  const [newHeaders, setNewHeaders] = useState<string[]>([""]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSheetNames();
  }, []);

  const loadSheetNames = async () => {
    setLoading(true);
    try {
      const names = await sheetApi.getSheetNames();
      setSheetNames(names);
    } catch (error) {
      console.error("Failed to load sheets:", error);
      alert("Cannot load sheets. Check Apps Script deployment and token.");
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setShowSheetDropdown(false);
    setLoading(true);
    try {
      const headerList = await sheetApi.getSheetHeaders(sheetName);
      setHeaders(headerList);
      const initialData: Record<string, unknown> = {};
      headerList.forEach((header) => {
        initialData[header] = "";
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Failed to load sheet headers:", error);
      alert("Cannot load sheet headers.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet) {
      alert("Please select target sheet first.");
      return;
    }

    setSubmitting(true);
    try {
      const success = await sheetApi.appendData(selectedSheet, formData);
      if (success) {
        alert("Data saved successfully.");
        const resetData: Record<string, unknown> = {};
        headers.forEach((header) => {
          resetData[header] = "";
        });
        setFormData(resetData);
      }
    } catch (error) {
      console.error("Failed to append data:", error);
      alert("Save failed. Please check Apps Script logs.");
    } finally {
      setSubmitting(false);
    }
  };

  const addHeaderField = () => setNewHeaders([...newHeaders, ""]);

  const removeHeaderField = (index: number) => {
    if (newHeaders.length > 1) {
      setNewHeaders(newHeaders.filter((_, i) => i !== index));
    }
  };

  const handleHeaderChange = (index: number, value: string) => {
    const updated = [...newHeaders];
    updated[index] = value;
    setNewHeaders(updated);
  };

  const handleCreateTable = async () => {
    if (!newSheetName.trim()) {
      alert("Please enter table name.");
      return;
    }

    if (newHeaders.some((header) => !header.trim())) {
      alert("Please fill all column names.");
      return;
    }

    setIsCreating(true);
    try {
      const success = await sheetApi.createSheet(newSheetName.trim(), newHeaders);
      if (success) {
        alert("New table created successfully.");
        setIsModalOpen(false);
        setNewSheetName("");
        setNewHeaders([""]);
        await loadSheetNames();
      }
    } catch (error) {
      console.error("Failed to create table:", error);
      alert("Create table failed. The sheet might already exist.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderField = (fieldName: string) => {
    const fieldType = detectFieldType(fieldName);
    const value = formData[fieldName] || "";

    switch (fieldType) {
      case "date":
        return (
          <div className="relative">
            <DatePicker
              selected={
                value
                  ? parse(String(value), "yyyy-MM-dd", new Date())
                  : null
              }
              onChange={(date: Date | null) =>
                handleInputChange(fieldName, date ? format(date, "yyyy-MM-dd") : "")
              }
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none cursor-pointer"
              wrapperClassName="w-full"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        );

      case "number":
        return (
          <input
            type="number"
            value={String(value)}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder="Enter number..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        );

      case "select": {
        const options = getSelectOptions(fieldName);
        return (
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setShowSelectDropdowns((prev) => ({
                  ...prev,
                  [fieldName]: !prev[fieldName],
                }))
              }
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 flex items-center justify-between outline-none"
            >
              <span>{String(value) || "Select..."}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showSelectDropdowns[fieldName] && (
              <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      handleInputChange(fieldName, option);
                      setShowSelectDropdowns((prev) => ({
                        ...prev,
                        [fieldName]: false,
                      }));
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName.toLowerCase()}...`}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" /> Create New Table
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Table Name
                </label>
                <input
                  type="text"
                  value={newSheetName}
                  onChange={(e) => setNewSheetName(e.target.value)}
                  placeholder="e.g. Study, Expenses, Project X"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center justify-between">
                  Define Columns
                  <span className="text-xs font-normal text-gray-500">
                    {newHeaders.length} columns added
                  </span>
                </label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {newHeaders.map((header, index) => (
                    <div key={index} className="flex gap-2 group">
                      <div className="flex-1 relative">
                        <Columns className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => handleHeaderChange(index, e.target.value)}
                          placeholder={`Column ${index + 1} Name...`}
                          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                      </div>
                      {newHeaders.length > 1 && (
                        <button
                          onClick={() => removeHeaderField(index)}
                          className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addHeaderField}
                    className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-indigo-300 transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Another Column
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 dark:bg-slate-800/50 flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTable}
                disabled={isCreating}
                className="flex-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCreating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Create New Table
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 bg-gradient-to-r from-indigo-500/5 to-violet-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                Google Sheets Manager
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Inject data directly into your cloud spreadsheets
              </p>
              {!isGasApiConfigured() && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                  Running in local fallback mode. Configure VITE_GAS_WEB_APP_URL to use Apps Script.
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all"
          >
            <Plus className="w-4 h-4" /> Create New Table
          </button>
        </div>

        <div className="p-8">
          <div className="max-w-2xl mx-auto space-y-8">
            <div>
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">
                Target Spreadsheet
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSheetDropdown(!showSheetDropdown)}
                  disabled={loading}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  <span className={selectedSheet ? "" : "text-gray-400"}>
                    {loading
                      ? "Refreshing sheets..."
                      : selectedSheet || "Which sheet are we writing to?"}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      showSheetDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showSheetDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {sheetNames.map((name) => (
                      <button
                        key={name}
                        onClick={() => handleSheetSelect(name)}
                        className={`w-full px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-bold ${
                          selectedSheet === name
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {headers.length > 0 ? (
              <form
                onSubmit={handleSubmitData}
                className="space-y-6 pt-6 border-t border-gray-50 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-500"
              >
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full" /> Auto-generated fields for "{selectedSheet}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {headers.map((header, index) => (
                    <div
                      key={index}
                      className={
                        detectFieldType(header) === "text" && header.length > 10
                          ? "md:col-span-2"
                          : ""
                      }
                    >
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                        {header}
                      </label>
                      {renderField(header)}
                    </div>
                  ))}
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5" />
                    )}
                    Save to Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const resetData: Record<string, unknown> = {};
                      headers.forEach((header) => {
                        resetData[header] = "";
                      });
                      setFormData(resetData);
                    }}
                    className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Reset
                  </button>
                </div>
              </form>
            ) : (
              !loading && (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                    <Database className="w-10 h-10 text-gray-200 dark:text-gray-700" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-gray-400">No Target Table Selected</p>
                    <p className="text-xs text-gray-500">
                      Select a sheet from the list above or create a new one to begin.
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
