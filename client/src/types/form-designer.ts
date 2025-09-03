export interface FormComponent {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'email' | 'file' | 'table' | 'chart';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  // Table specific properties
  columns?: {
    id: string;
    label: string;
    type: 'text' | 'number' | 'date';
  }[];
  rows?: Record<string, any>[];
  tableColumns?: number;
  tableRows?: number;
  showHeader?: boolean;
  showBorders?: boolean;
  columnWidths?: number[];
  rowHeights?: number[];
  // Chart specific properties
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  dataSource?: string; // ID of table component to use as data source
  xAxis?: string; // Column name for X axis
  yAxis?: string; // Column name for Y axis
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
}

export interface FormSchema {
  id: string;
  name: string;
  description?: string;
  components: FormComponent[];
  settings: {
    submitText?: string;
    resetText?: string;
    successMessage?: string;
    errorMessage?: string;
  };
}

export interface DragItem {
  type: string;
  componentType: FormComponent['type'];
  label: string;
}
