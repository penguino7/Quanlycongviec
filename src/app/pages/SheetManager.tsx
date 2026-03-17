import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, Save, ChevronDown } from 'lucide-react';

// Mock API để giả lập Google Apps Script
const mockGoogleSheetsAPI = {
  // Lấy danh sách các Tab/Sheet
  getSheetNames: async (): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return ['Công việc', 'Chi tiêu', 'Khách hàng', 'Dự án'];
  },

  // Lấy cấu trúc cột (header) của một Sheet
  getSheetHeaders: async (sheetName: string): Promise<string[]> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
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
};

// Hàm nhận diện kiểu dữ liệu dựa trên tên cột
const detectFieldType = (fieldName: string): 'date' | 'number' | 'select' | 'text' => {
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('ngày') || lowerName.includes('hạn') || lowerName.includes('date')) {
    return 'date';
  }
  if (lowerName.includes('số') || lowerName.includes('tiền') || lowerName.includes('ngân sách') || lowerName.includes('number')) {
    return 'number';
  }
  if (lowerName.includes('trạng thái') || lowerName.includes('độ ưu tiên') || lowerName.includes('status') || lowerName.includes('priority')) {
    return 'select';
  }
  
  return 'text';
};

// Mock options cho các trường Select
const getSelectOptions = (fieldName: string): string[] => {
  const lowerName = fieldName.toLowerCase();
  
  if (lowerName.includes('trạng thái')) {
    return ['Chưa làm', 'Đang làm', 'Hoàn thành'];
  }
  if (lowerName.includes('độ ưu tiên')) {
    return ['Thấp', 'Trung bình', 'Cao'];
  }
  
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

  // Bước 1: Load danh sách Sheet khi component mount
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

  // Bước 2: Load header khi chọn Sheet
  const handleSheetSelect = async (sheetName: string) => {
    setSelectedSheet(sheetName);
    setShowSheetDropdown(false);
    setLoading(true);
    
    try {
      const headerList = await mockGoogleSheetsAPI.getSheetHeaders(sheetName);
      setHeaders(headerList);
      
      // Reset form data
      const initialData: Record<string, any> = {};
      headerList.forEach(header => {
        initialData[header] = '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error('Lỗi khi tải cấu trúc Sheet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi giá trị form
  const handleInputChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  // Bước 4: Gửi dữ liệu
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSheet) {
      alert('Vui lòng chọn bảng dữ liệu!');
      return;
    }

    setSubmitting(true);
    try {
      const success = await mockGoogleSheetsAPI.appendData(selectedSheet, formData);
      
      if (success) {
        alert('✅ Dữ liệu đã được lưu thành công!');
        
        // Reset form
        const resetData: Record<string, any> = {};
        headers.forEach(header => {
          resetData[header] = '';
        });
        setFormData(resetData);
      }
    } catch (error) {
      console.error('Lỗi khi gửi dữ liệu:', error);
      alert('❌ Có lỗi xảy ra khi lưu dữ liệu!');
    } finally {
      setSubmitting(false);
    }
  };

  // Render field dựa trên kiểu dữ liệu
  const renderField = (fieldName: string) => {
    const fieldType = detectFieldType(fieldName);
    const value = formData[fieldName] || '';

    switch (fieldType) {
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder="Nhập số..."
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
          />
        );

      case 'select':
        const options = getSelectOptions(fieldName);
        return (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSelectDropdowns(prev => ({ ...prev, [fieldName]: !prev[fieldName] }))}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all flex items-center justify-between"
            >
              <span className={value ? '' : 'text-gray-400 dark:text-gray-500'}>
                {value || 'Chọn...'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
            
            {showSelectDropdowns[fieldName] && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowSelectDropdowns(prev => ({ ...prev, [fieldName]: false }))}
                />
                <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                  {options.map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        handleInputChange(fieldName, option);
                        setShowSelectDropdowns(prev => ({ ...prev, [fieldName]: false }));
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100 transition-colors"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Nhập ${fieldName.toLowerCase()}...`}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all"
          />
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 dark:bg-indigo-500 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý Google Sheets</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">Thêm dữ liệu vào bảng tính của bạn</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Bước 1: Chọn Sheet */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Chọn bảng dữ liệu
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSheetDropdown(!showSheetDropdown)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all flex items-center justify-between disabled:opacity-50"
              >
                <span className={selectedSheet ? '' : 'text-gray-400 dark:text-gray-500'}>
                  {loading ? 'Đang tải...' : (selectedSheet || 'Chọn bảng dữ liệu...')}
                </span>
                {loading ? (
                  <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>
              
              {showSheetDropdown && !loading && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowSheetDropdown(false)}
                  />
                  <div className="absolute z-20 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
                    {sheetNames.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handleSheetSelect(name)}
                        className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                          selectedSheet === name 
                            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-medium' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bước 2 & 3: Form động */}
          {headers.length > 0 && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-indigo-700 dark:text-indigo-400">
                  ✨ <strong>Form thông minh:</strong> Các trường nhập liệu tự động được tạo dựa trên cấu trúc của bảng "{selectedSheet}"
                </p>
              </div>

              {headers.map((header, index) => (
                <div key={index}>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {header}
                    <span className="ml-1 text-xs font-normal text-gray-500 dark:text-gray-400">
                      ({detectFieldType(header) === 'date' ? 'Chọn ngày' : 
                        detectFieldType(header) === 'number' ? 'Nhập số' :
                        detectFieldType(header) === 'select' ? 'Chọn từ danh sách' :
                        'Nhập text'})
                    </span>
                  </label>
                  {renderField(header)}
                </div>
              ))}

              {/* Nút Submit */}
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Lưu dữ liệu
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    const resetData: Record<string, any> = {};
                    headers.forEach(header => {
                      resetData[header] = '';
                    });
                    setFormData(resetData);
                  }}
                  className="px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-semibold"
                >
                  Xóa form
                </button>
              </div>
            </form>
          )}

          {/* Empty state */}
          {!selectedSheet && !loading && (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Vui lòng chọn bảng dữ liệu để bắt đầu
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">💡 Hướng dẫn sử dụng</h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
          <li>1️⃣ Chọn bảng dữ liệu từ danh sách dropdown</li>
          <li>2️⃣ Form sẽ tự động "biến hình" theo cấu trúc cột của bảng</li>
          <li>3️⃣ Điền thông tin vào các trường (hệ thống tự nhận diện kiểu dữ liệu)</li>
          <li>4️⃣ Nhấn "Lưu dữ liệu" để gửi lên Google Sheets</li>
        </ul>
      </div>
    </div>
  );
};
