import React, { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Plus,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieIcon,
  Search,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";
import { financeApi, isGasApiConfigured } from "../services/gasApi";
import { FinanceDto } from "../services/types";

const fallbackFinanceData: FinanceDto[] = [
  { id: "1", date: "2026-03-01", category: "Luong", type: "income", amount: 25000000, note: "Luong thang 2" },
  { id: "2", date: "2026-03-02", category: "An uong", type: "expense", amount: 150000, note: "An trua" },
  { id: "3", date: "2026-03-05", category: "Di chuyen", type: "expense", amount: 500000, note: "Xang xe" },
  { id: "4", date: "2026-03-10", category: "Mua sam", type: "expense", amount: 2500000, note: "Mua quan ao" },
  { id: "5", date: "2026-03-12", category: "Thuong", type: "income", amount: 5000000, note: "Thuong du an" },
  { id: "6", date: "2026-03-14", category: "An uong", type: "expense", amount: 1200000, note: "Tiec sinh nhat" },
  { id: "7", date: "2026-03-15", category: "Tien dien", type: "expense", amount: 850000, note: "Tien dien thang 2" },
  { id: "8", date: "2026-03-16", category: "An uong", type: "expense", amount: 200000, note: "Ca phe hop nhom" },
  { id: "9", date: "2026-03-17", category: "Mua sam", type: "expense", amount: 1500000, note: "Mua chuot moi" },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export const Finance = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [data, setData] = useState<FinanceDto[]>(fallbackFinanceData);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [loading, setLoading] = useState<boolean>(isGasApiConfigured());
  const [summary, setSummary] = useState<{
    totalIncome: number;
    totalExpense: number;
    balance: number;
    topCategory: string;
    topAmount: number;
  } | null>(null);
  const [categoryFromApi, setCategoryFromApi] = useState<Array<{ name: string; value: number }> | null>(null);

  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsTypeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadFinance = async () => {
    if (!isGasApiConfigured()) return;

    setLoading(true);
    try {
      const pageSize = 200;
      let page = 1;
      let all: FinanceDto[] = [];

      while (true) {
        const res = await financeApi.list({ page, pageSize });
        all = all.concat(res.items);
        if (res.items.length < pageSize) break;
        page += 1;
        if (page > 100) break;
      }

      const [summaryRes, categoryRes] = await Promise.all([
        financeApi.summary(),
        financeApi.byCategory(),
      ]);

      setData(all);
      setSummary(summaryRes);
      setCategoryFromApi(categoryRes.items);
    } catch (error) {
      console.error("Failed to load finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const computedStats = useMemo(() => {
    const totalIncome = data
      .filter((d) => d.type === "income")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpense = data
      .filter((d) => d.type === "expense")
      .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
  }, [data]);

  const computedCategoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    data
      .filter((d) => d.type === "expense")
      .forEach((curr) => {
        categories[curr.category] = (categories[curr.category] || 0) + curr.amount;
      });

    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  const categoryData = categoryFromApi && categoryFromApi.length > 0 ? categoryFromApi : computedCategoryData;

  const stats = {
    totalIncome: summary?.totalIncome ?? computedStats.totalIncome,
    totalExpense: summary?.totalExpense ?? computedStats.totalExpense,
    balance: summary?.balance ?? computedStats.balance,
    topAmount: summary?.topAmount ?? (categoryData[0]?.value || 0),
  };

  const filteredList = data
    .filter((item) => {
      const matchesSearch =
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.note.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || item.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const StatCard = ({ title, value, icon, trend }: any) => (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-xl bg-gray-100 dark:bg-slate-800">{icon}</div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
              trend > 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
            }`}
          >
            {trend > 0 ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white">{formatCurrency(value)}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Finance Manager</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your income and expenses from Google Sheets.</p>
          {!isGasApiConfigured() && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-2">
              Running in local fallback mode. Configure VITE_GAS_WEB_APP_URL to use Apps Script.
            </p>
          )}
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all shadow-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
            <Plus className="w-5 h-5" /> New Entry
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2 rounded-lg">
          Loading finance data from Apps Script API...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={stats.totalIncome}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          trend={12}
        />
        <StatCard
          title="Total Expense"
          value={stats.totalExpense}
          icon={<TrendingDown className="w-6 h-6 text-rose-600" />}
          trend={-5}
        />
        <StatCard
          title="Current Balance"
          value={stats.balance}
          icon={<Wallet className="w-6 h-6 text-indigo-600" />}
        />
        <StatCard
          title="Top Spending"
          value={stats.topAmount}
          icon={<PieIcon className="w-6 h-6 text-amber-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Spending by Category</h2>
            <PieIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    backgroundColor: isDark ? "#1e293b" : "#ffffff",
                    color: isDark ? "#f8fafc" : "#0f172a",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {categoryData.slice(0, 4).map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {formatCurrency(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col">
          <div className="p-6 border-b border-gray-50 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search note or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                />
              </div>

              <div className="relative w-full sm:w-40" ref={dropdownRef}>
                <button
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-all"
                >
                  <span className="capitalize">{filterType}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isTypeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute top-full mt-2 right-0 w-full min-w-[150px] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {["all", "income", "expense"].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setFilterType(type as "all" | "income" | "expense");
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-sm font-bold flex items-center justify-between transition-colors ${
                          filterType === type
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        <span className="capitalize">{type}</span>
                        {filterType === type && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs uppercase font-black text-gray-400 dark:text-gray-500 border-b border-gray-50 dark:border-slate-800">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Transaction</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                {filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {format(parseISO(item.date), "MMM dd, yyyy")}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                          {format(parseISO(item.date), "EEEE")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === "income" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                          {item.type === "income" ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                            {item.category}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px]">
                            {item.note}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-sm">
                      <span className={item.type === "income" ? "text-emerald-500" : "text-rose-500"}>
                        {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-400 italic">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
