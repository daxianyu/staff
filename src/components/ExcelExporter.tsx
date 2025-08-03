import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// 单个sheet的数据结构
export interface SheetData {
  name: string; // sheet名称
  headers: string[]; // 表头
  data: any[][]; // 数据行
}

// 导出配置
export interface ExportConfig {
  filename?: string; // 文件名（不包含扩展名）
  sheets: SheetData[]; // 多个sheet数据
}

// Excel导出组件Props
export interface ExcelExporterProps {
  config: ExportConfig;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

/**
 * 通用Excel导出组件
 * 支持多sheet导出，自动处理中文文件名
 */
export function ExcelExporter({ 
  config, 
  children, 
  className = '', 
  disabled = false 
}: ExcelExporterProps) {
  
  const exportToExcel = () => {
    try {
      // 创建工作簿
      const workbook = XLSX.utils.book_new();
      
      // 为每个sheet创建工作表
      config.sheets.forEach((sheet) => {
        // 创建工作表数据（包含表头）
        const worksheetData = [sheet.headers, ...sheet.data];
        
        // 创建工作表
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
        
        // 设置列宽（根据内容自动调整）
        const colWidths = sheet.headers.map((header, index) => {
          const maxLength = Math.max(
            header.length,
            ...sheet.data.map(row => {
              const cellValue = row[index];
              return cellValue ? String(cellValue).length : 0;
            })
          );
          return { wch: Math.min(Math.max(maxLength + 2, 8), 50) };
        });
        worksheet['!cols'] = colWidths;
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      });
      
      // 生成Excel文件
      const excelBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });
      
      // 创建Blob
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const filename = `${config.filename || 'export'}_${timestamp}.xlsx`;
      
      // 下载文件
      saveAs(blob, filename);
      
    } catch (error) {
      console.error('导出Excel失败:', error);
      alert('导出失败，请重试');
    }
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

/**
 * 工具函数：将表格数据转换为Excel格式
 */
export function convertTableToSheetData(
  headers: string[],
  data: any[],
  sheetName: string = 'Sheet1'
): SheetData {
  const rows = data.map(row => {
    return headers.map(header => {
      // 根据header获取对应的数据
      const value = row[header] || row[header.toLowerCase()] || '';
      return value;
    });
  });
  
  return {
    name: sheetName,
    headers,
    data: rows
  };
}

/**
 * 工具函数：将对象数组转换为Excel格式
 */
export function convertObjectsToSheetData(
  data: any[],
  headers: string[],
  sheetName: string = 'Sheet1'
): SheetData {
  const rows = data.map(item => {
    return headers.map(header => {
      // 支持嵌套属性访问，如 'user.name'
      const keys = header.split('.');
      let value = item;
      for (const key of keys) {
        value = value?.[key];
        if (value === undefined || value === null) break;
      }
      return value || '';
    });
  });
  
  return {
    name: sheetName,
    headers,
    data: rows
  };
} 