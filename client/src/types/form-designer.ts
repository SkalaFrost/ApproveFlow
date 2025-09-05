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
    type: 'text' | 'number' | 'date' | 'currency';
    alignment?: 'left' | 'center' | 'right';
    width?: number;
    sortable?: boolean;
    editable?: boolean;
    required?: boolean;
    validationRules?: {
      min?: number;
      max?: number;
      pattern?: string;
      message?: string;
    };
  }[];
  rows?: Record<string, any>[];
  tableColumns?: number;
  tableRows?: number;
  showHeader?: boolean;
  showBorders?: boolean;
  columnWidths?: number[];
  rowHeights?: number[];
  
  // Table appearance properties
  headerBackgroundColor?: string; // Header background color
  headerTextColor?: string; // Header text color
  alternateRowColors?: boolean; // Alternate row colors
  evenRowColor?: string; // Even row background color
  oddRowColor?: string; // Odd row background color
  borderStyle?: 'none' | 'solid' | 'dashed' | 'dotted'; // Border style
  tableBorderColor?: string; // Table border color
  rowHeight?: number; // Default row height
  
  // Table functionality properties
  sortable?: boolean; // Allow column sorting
  sortableColumns?: string[]; // Array of sortable column IDs
  pagination?: boolean; // Enable pagination
  rowsPerPage?: number; // Rows per page
  fixedHeader?: boolean; // Fixed header when scrolling
  showRowNumbers?: boolean; // Show row numbers
  allowEdit?: boolean; // Allow inline editing
  editableColumns?: string[]; // Array of editable column IDs
  requiredColumns?: string[]; // Array of required column IDs
  // Chart specific properties
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  dataSource?: string; // ID of table component to use as data source
  xAxis?: string; // Column name for X axis
  yAxis?: string; // Column name for Y axis
  
  // Chart appearance properties
  title?: string; // Custom chart title
  backgroundColor?: string; // Chart background color
  chartBorderColor?: string; // Chart border color
  colors?: string[]; // Array of colors for bars/data points
  showLegend?: boolean; // Show legend
  legendPosition?: 'top' | 'bottom' | 'left' | 'right'; // Legend position
  
  // Chart data formatting
  dataFormat?: 'number' | 'currency' | 'percentage'; // Number format
  decimalPlaces?: number; // Number of decimal places
  showValues?: boolean; // Show values on chart
  valuePosition?: 'top' | 'center' | 'inside'; // Value label position
  
  // Chart grid and axes
  showGrid?: boolean; // Show grid lines
  gridColor?: string; // Grid line color
  xAxisTitle?: string; // Custom X axis title
  yAxisTitle?: string; // Custom Y axis title
  showAxisLabels?: boolean; // Show axis labels
  
  // Chart type specific properties
  barOrientation?: 'vertical' | 'horizontal'; // Bar direction
  barStyle?: 'grouped' | 'stacked'; // Bar style
  lineStyle?: 'straight' | 'curved' | 'stepped'; // Line style
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
  rotation?: number;
  
  // Workflow step permissions
  stepPermissions?: {
    [stepId: string]: {
      read: boolean;
      edit: boolean;
    };
  };
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
