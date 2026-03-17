import React, { useState, useEffect, useRef } from 'react';
import { Database, RefreshCw, Save, ChevronDown, Plus, Trash2, X, Columns, Calendar as CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import { parseISO, format, parse } from 'date-fns';

// Mock API để giả lập Google Apps Script
const mockGoogleSheetsAPI = {
  // Lấy danh sách các Tab/Sheet
  getSheetNames: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Sử dụng localStorage để giả lập persistence cho các sheet mới tạo
    const savedSheets = localStorage.getItem('mockSheets');
    if (savedSheets) return JSON.parse(savedSheets);
    const initialSheets = ['Công việc', 'Chi tiêu', 'Khách hàng', 'Dự án'];
    localStorage.setItem('mockSheets', JSON.stringify(initialSheets));
    return initialSheets;
  },

  // Lấy cấu trúc cột (header) của một Sheet
  getSheetHeaders: async (sheetName: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const savedHeaders = localStorage.getItem(`headers_${sheetName}`);
    if (savedHeaders) return JSON.parse(savedHeaders);

    const mockHeaders: Record<string, string[]> = {
      'Công việc': ['Tiêu đề', 'Mô tả', 'Độ ưu tiên', 'Trạng thái', 'Ngày hết hạn'],
      'Chi tiêu': ['Ngày tháng', 'Hạng mục', 'Số tiền', 'Ghi chú'],
      'Khách hàng': ['Tên khách hàng', 'Email', 'Số điện thoại', 'Trạng thái', 'Ngày tạo'],
      'Dự án': ['Tên dự án', 'Ngân sách', 'Ngày bắt đầu', 'Ngày kết thúc', 'Trạng thái'],
    };
    
    return mockHeaders[sheetName] || [];
  },

  // Gửi dữ liệu mới vào Sheet
  appendData: async (sheetName: string, data: Record<string, any>): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`📝 Dữ liệu được gửi đến Sheet "${sheetName}":`, data);
    return true;
  },

  // Tạo Sheet mới
  createSheet: async (sheetName: string, headers: string[]): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Lưu tên sheet vào danh sách
    const savedSheets = JSON.parse(localStorage.getItem('mockSheets') || '[]');
    if (!savedSheets.includes(sheetName)) {
      localStorage.setItem('mockSheets', JSON.stringify([...savedSheets, sheetName]));
    }
    
    // Lưu headers cho sheet đó
    localStorage.setItem(`headers_${sheetName}`, JSON.stringify(headers));
    
    return true;
  }
};

const detectFieldType = (fieldName: string): 'date' | 'number' | 'select' | 'text' => {
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('ngày') || lowerName.includes('hạn') || lowerName.includes('date')) return 'date';
  if (lowerName.includes('số') || lowerName.includes('tiền') || lowerName.includes('ngân sách') || lowerName.includes('number')) return 'number';
  if (lowerName.includes('trạng thái') || lowerName.includes('độ ưu tiên') || lowerName.includes('status') || lowerName.includes('priority')) return 'select';
  return 'text';
};

const getSelectOptions = (fieldName: string): string[] => {
  const lowerName = fieldName.toLowerCase();
  if (lowerName.includes('trạng thái')) return ['Chưa làm', 'Đang làm', 'Hoàn thành'];
  if (lowerName.includes('độ ưu tiên')) return ['Thấp', 'Trung bình', 'Cao'];
  return [];
};

export const SheetManager = () => {
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSheetDropdown, setShowSheetDropdown] = useState(false);
  const [showSelectDropdowns, setShowSelectDropdowns] = useState<Record<string, boolean>>({});

  // States cho tính năng tạo bảng mới
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSheetName, setNewSheetName] = useState('');
  const [newHeaders, setNewHeaders] = useState<string[]>(['']);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadSheetNames();
  }, []);

  const loadSheetNames = async () => {
    setLoading(true);
    try {
      const names = await mockGoogleSheetsAPI.getSheetNames();
      setSheetNames(names);
    } catch (error) {
      console.error('Lỗi khi tải danh sách Sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setShowSheetDropdown(false);
    setLoading(true);
    try {
      const headerList = await mockGoogleSheetsAPI.getSheetHeaders(sheetName);
      setHeaders(headerList);
      const initialData: Record<string, any> = {};
      headerList.forEach(header => { initialData[header] = ''; });
      setFormData(initialData);
    } catch (error) {
      console.error('Lỗi khi tải cấu trúc Sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSheet) { alert('Vui lòng chọn bảng dữ liệu!'); return; }
    setSubmitting(true);
    try {
      const success = await mockGoogleSheetsAPI.appendData(selectedSheet, formData);
      if (success) {
        alert('✅ Dữ liệu đã được lưu thành công!');
        const resetData: Record<string, any> = {};
        headers.forEach(header => { resetData[header] = ''; });
        setFormData(resetData);
      }
    } catch (error) {
      console.error('Lỗi khi gửi dữ liệu:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Logic tạo bảng mới
  const addHeaderField = () => setNewHeaders([...newHeaders, '']);
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
    if (!newSheetName.trim()) { alert('Vui lòng nhập tên bảng!'); return; }
    if (newHeaders.some(h => !h.trim())) { alert('Vui lòng nhập đầy đủ tên các cột!'); return; }
    
    setIsCreating(true);
    try {
      const success = await mockGoogleSheetsAPI.createSheet(newSheetName, newHeaders);
      if (success) {
        alert('✅ Đã tạo bảng mới thành công!');
        setIsModalOpen(false);
        setNewSheetName('');
        setNewHeaders(['']);
        await loadSheetNames(); // Refresh list
      }
    } catch (error) {
      console.error('Lỗi tạo bảng:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const renderField = (fieldName: string) => {
    const fieldType = detectFieldType(fieldName);
    const value = formData[fieldName] || '';
    switch (fieldType) {
      case 'date':
        return (
          <div className="relative">
            <DatePicker
              selected={value ? parse(value, 'yyyy-MM-dd', new Date()) : null}
              onChange={(date: Date | null) => handleInputChange(fieldName, date ? format(date, 'yyyy-MM-dd') : '')}
              dateFormat="dd/MM/yyyy"
              placeholderText="Select date..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none cursor-pointer"
              wrapperClassName="w-full"
            />
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        );
      case 'number':
        return <input type="number" value={value} onChange={(e) => handleInputChange(fieldName, e.target.value)} placeholder="Nhập số..." className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />;
      case 'select':
        const options = getSelectOptions(fieldName);
        return (
          <div className="relative">
            <button type="button" onClick={() => setShowSelectDropdowns(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 flex items-center justify-between outline-none">
              <span>{value || 'Chọn...'}</span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            {showSelectDropdowns[fieldName] && (
              <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {options.map(option => (
                  <button key={option} type="button" onClick={() => { handleInputChange(fieldName, option); setShowSelectDropdowns(prev => ({ ...prev, [fieldName]: false })); }} className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors">
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return <input type="text" value={value} onChange={(e) => handleInputChange(fieldName, e.target.value)} placeholder={`Nhập ${fieldName.toLowerCase()}...`} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Create Table Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" /> Create New Table
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Table Name</label>
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
                  <span className="text-xs font-normal text-gray-500">{newHeaders.length} columns added</span>
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
                {isCreating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Create New Table
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-50 dark:border-slate-800 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Google Sheets Manager</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Inject data directly into your cloud spreadsheets</p>
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
              <label className="block text-sm font-black text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider">Target Spreadsheet</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSheetDropdown(!showSheetDropdown)}
                  disabled={loading}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-bold flex items-center justify-between outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
                >
                  <span className={selectedSheet ? '' : 'text-gray-400'}>
                    {loading ? 'Refreshing sheets...' : (selectedSheet || 'Which sheet are we writing to?')}
                  </span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showSheetDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSheetDropdown && (
                  <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {sheetNames.map(name => (
                      <button key={name} onClick={() => handleSheetSelect(name)} className={`w-full px-6 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-bold ${selectedSheet === name ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5' : 'text-gray-600 dark:text-gray-400'}`}>
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {headers.length > 0 ? (
              <form onSubmit={handleSubmitData} className="space-y-6 pt-6 border-t border-gray-50 dark:border-slate-800 animate-in slide-in-from-bottom-4 duration-500">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1 h-1 bg-indigo-500 rounded-full" /> Auto-Generated Fields for "{selectedSheet}"
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {headers.map((header, index) => (
                    <div key={index} className={detectFieldType(header) === 'text' && header.length > 10 ? 'md:col-span-2' : ''}>
                      <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{header}</label>
                      {renderField(header)}
                    </div>
                  ))}
                </div>

                <div className="pt-8 flex flex-col sm:flex-row gap-3">
                  <button type="submit" disabled={submitting} className="flex-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3">
                    {submitting ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save to Cloud
                  </button>
                  <button type="button" onClick={() => { setFormData({}); }} className="flex-1 py-4 rounded-xl border border-gray-200 dark:border-slate-800 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 transition-all">
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
                    <p className="text-xs text-gray-500">Select a sheet from the list above or create a new one to begin.</p>
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
