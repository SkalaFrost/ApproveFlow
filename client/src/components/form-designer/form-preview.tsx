import React, { useState, useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Move, BarChart3, GripVertical, RotateCw } from "lucide-react";
import ImageBackground from "./image-background";
import ComponentPalette from "./component-palette";
import type { FormComponent } from "@/types/form-designer";

interface FormPreviewProps {
  components: FormComponent[];
  onRemoveComponent: (id: string) => void;
  onComponentClick?: (id: string, event?: React.MouseEvent) => void;
  selectedComponentId?: string | null;
  selectedComponentIds?: string[];
  imageFile?: File | null;
  onUpdateComponent?: (components: FormComponent[]) => void;
  zoom?: number;
  onSelectionStart?: (e: React.MouseEvent) => void;
  isSelecting?: boolean;
  selectionBox?: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null;
  isComponentPaletteCollapsed?: boolean;
  onToggleComponentPalette?: (collapsed: boolean) => void;
}

// Danh sách các field type có thể resize
const RESIZABLE_FIELD_TYPES = ["textarea", "text", "number", "table", "chart"];

// Default table structure
const defaultColumns = [
  { id: "col1", label: "Column 1", type: "text" },
  { id: "col2", label: "Column 2", type: "text" },
  { id: "col3", label: "Column 3", type: "text" },
];

const defaultRows = [
  {
    col1: "Row 1 Data 1",
    col2: "Row 1 Data 2",
    col3: "Row 1 Data 3",
  },
  {
    col1: "Row 2 Data 1",
    col2: "Row 2 Data 2",
    col3: "Row 2 Data 3",
  },
];

function PreviewComponent({
  component,
  onRemove,
  onMove,
  onResize,
  onResizeAndMove,
  onRotate,
  onClick,
  isSelected,
  isMultiSelected,
  zoom = 1,
  isAltPressed = false,
  fieldValues = {},
  onFieldChange,
  onUpdateComponent,
  components,
  allComponents,
}: {
  component: FormComponent;
  onRemove: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onResizeAndMove: (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => void;
  onRotate?: (id: string, rotation: number) => void;
  onClick?: (id: string, event?: React.MouseEvent) => void;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  zoom?: number;
  isAltPressed?: boolean;
  fieldValues?: Record<string, any>;
  onFieldChange?: (componentId: string, value: any) => void;
  onUpdateComponent?: (id: string, updates: Partial<FormComponent>) => void;
  components?: FormComponent[];
  allComponents?: FormComponent[];
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `component-${component.id}`,
    data: {
      type: "form-component",
      component,
    },
    disabled: isAltPressed,
  });

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.altKey || isAltPressed) return;

    setIsDragging(true);
    document.body.style.cursor = "grabbing";

    const componentElement = e.currentTarget.closest(
      ".form-component",
    ) as HTMLElement;
    if (!componentElement) return;

    // Get initial component position
    const startX = component.position.x;
    const startY = component.position.y;
    
    // Get initial mouse position
    const startMouseX = e.clientX;
    const startMouseY = e.clientY;

    const handleDragMove = (e: MouseEvent) => {
      // Calculate the distance moved
      const deltaX = (e.clientX - startMouseX) / zoom;
      const deltaY = (e.clientY - startMouseY) / zoom;
      
      // Apply the delta to the original position
      const newX = Math.max(0, startX + deltaX);
      const newY = Math.max(0, startY + deltaY);
      
      onMove(component.id, newX, newY);
    };

    const handleDragUp = () => {
      setIsDragging(false);
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragUp);
    };

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragUp);
  };

  const handleResizeMouseDown = (
    e: React.MouseEvent,
    handle: "se" | "ne" | "sw" | "nw" | "n" | "s" | "e" | "w",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!RESIZABLE_FIELD_TYPES.includes(component.type)) return;

    setIsResizing(true);

    const componentElement = e.currentTarget.closest(
      ".form-component",
    ) as HTMLElement;
    if (!componentElement) return;

    const startX = e.clientX / zoom;
    const startY = e.clientY / zoom;
    const startWidth = component.size.width;
    const startHeight = component.size.height;
    const startPosX = component.position.x;
    const startPosY = component.position.y;

    const handleResizeMove = (e: MouseEvent) => {
      const currentX = e.clientX / zoom;
      const currentY = e.clientY / zoom;
      const deltaX = currentX - startX;
      const deltaY = currentY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;
      let positionChanged = false;

      if (handle.includes("e")) {
        newWidth = Math.max(50, startWidth + deltaX);
      }
      if (handle.includes("w")) {
        newWidth = Math.max(50, startWidth - deltaX);
        newX = Math.max(0, startPosX + deltaX);
        positionChanged = true;
      }
      if (handle.includes("s")) {
        newHeight = Math.max(30, startHeight + deltaY);
      }
      if (handle.includes("n")) {
        newHeight = Math.max(30, startHeight - deltaY);
        newY = Math.max(0, startPosY + deltaY);
        positionChanged = true;
      }

      if (component.type === "table") {
        const cols = component.columns || defaultColumns;
        const rows = component.rows || defaultRows;
        const currentColumnWidths = component.columnWidths || cols.map(() => 120);
        const newColumnWidths = currentColumnWidths.map(width => Math.max(50, width * newWidth/startWidth));
        
        const currentRowHeights = component.rowHeights || (component.showHeader !== false ? [40, ...rows.map(() => 40)] : rows.map(() => 40));
        const newRowHeights = currentRowHeights.map(height => Math.max(20, height * newHeight/startHeight));
        
        const updates: Partial<FormComponent> = {
          size: { width: newWidth, height: newHeight },
          columnWidths: newColumnWidths,
          rowHeights: newRowHeights
        };
        
        if (positionChanged) {
          updates.position = { x: Math.max(0, newX), y: Math.max(0, newY) };
        }
        
        onUpdateComponent?.(component.id, updates);
      } else {
        if (positionChanged) {
          onResizeAndMove(
            component.id,
            Math.max(0, newX),
            Math.max(0, newY),
            newWidth,
            newHeight,
          );
        } else {
          onResize(component.id, newWidth, newHeight);
        }
      }
    };

    const handleResizeUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", handleResizeMove);
      document.removeEventListener("mouseup", handleResizeUp);
    };

    document.addEventListener("mousemove", handleResizeMove);
    document.addEventListener("mouseup", handleResizeUp);
  };

  const handleFieldChange = (value: any) => {
    onFieldChange?.(component.id, value);
  };

  const handleFieldFocus = (e: React.FocusEvent) => {
    e.stopPropagation();
  };

  const handleFieldClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const renderInput = () => {
    switch (component.type) {
      case "text":
        return (
          <Input
            type={component.type}
            placeholder={component.placeholder || `Enter ${component.label.toLowerCase()}`}
            required={component.required}
            value={fieldValues[component.id] || ""}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          />
        );

      case "textarea":
        const textareaRef = React.useRef<HTMLTextAreaElement>(null);

        const autoResize = (textarea: HTMLTextAreaElement) => {
          textarea.style.height = "auto";
          textarea.style.height = Math.max(textarea.scrollHeight, 60) + "px";

          const container = textarea.closest(".form-component") as HTMLElement;
          if (container) {
            const newHeight = Math.max(
              textarea.scrollHeight + 24,
              component.size.height,
            );
            container.style.height = newHeight + "px";
          }
        };

        React.useEffect(() => {
          if (textareaRef.current) {
            autoResize(textareaRef.current);
          }
        }, [fieldValues[component.id]]);

        return (
          <Textarea
            ref={textareaRef}
            placeholder={component.placeholder || `Enter ${component.label.toLowerCase()}`}
            required={component.required}
            value={fieldValues[component.id] || ""}
            onChange={(e) => {
              handleFieldChange(e.target.value);
              autoResize(e.target);
            }}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full resize-none min-h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            style={{ overflow: "hidden" }}
          />
        );

      case "select":
        return (
          <Select
            value={fieldValues[component.id] || ""}
            onValueChange={handleFieldChange}
          >
            <SelectTrigger
              onFocus={handleFieldFocus}
              onClick={handleFieldClick}
              className="border-0 rounded-none bg-transparent w-full h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            >
              <SelectValue placeholder={component.placeholder || "Select option"} />
            </SelectTrigger>
            <SelectContent>
              {component.options?.length ? (
                component.options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))
              ) : (
                <>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        );

      case "checkbox":
        return (
          <Checkbox
            id={component.id}
            required={component.required}
            checked={fieldValues[component.id] || false}
            onCheckedChange={handleFieldChange}
            onClick={handleFieldClick}
          />
        );

      case "file":
        return (
          <Input
            type="file"
            required={component.required}
            onChange={(e) => handleFieldChange(e.target.files?.[0] || null)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          />
        );

      case "table":
        const tableRef = React.useRef<HTMLTableElement>(null);
        const [editingCell, setEditingCell] = React.useState<{
          row: number;
          col: string;
        } | null>(null);
        const [editingColumn, setEditingColumn] = React.useState<string | null>(null);

        const currentColumns = component.columns || defaultColumns;
        const currentRows = component.rows || defaultRows;

        // Auto-resize table container to match content exactly (disabled to let container size control)
        // const autoResizeTable = () => {
        //   if (tableRef.current && !isResizing) {
        //     const totalHeight = (component.rowHeights || []).reduce((sum, height) => sum + height, 0);
        //     const totalWidth = (component.columnWidths || []).reduce((sum, width) => sum + width, 0);
        //     
        //     if (onUpdateComponent && totalHeight > 0 && totalWidth > 0) {
        //       onUpdateComponent(component.id, {
        //         size: {
        //           width: totalWidth,
        //           height: totalHeight
        //         }
        //       });
        //     }
        //   }
        // };

        // React.useEffect(() => {
        //   autoResizeTable();
        // }, [component.columns, component.rows, component.columnWidths, component.rowHeights]);

        const updateTableData = (newColumns?: any[], newRows?: any[]) => {
          component.columns = newColumns || component.columns;
          component.rows = newRows || component.rows;
        };
        
        const updateTableProps = (props: Partial<FormComponent>) => {
          if (onUpdateComponent) {
            onUpdateComponent(component.id, props);
          }
        };

        const handleCellEdit = (rowIndex: number, colId: string, value: string) => {
          const newRows = [...currentRows];
          newRows[rowIndex] = { ...newRows[rowIndex], [colId]: value };
          updateTableData(currentColumns, newRows);
          setEditingCell(null);
        };

        const handleColumnEdit = (colId: string, newLabel: string) => {
          const newColumns = currentColumns.map(col => 
            col.id === colId ? { ...col, label: newLabel } : col
          );
          updateTableData(newColumns, currentRows);
          setEditingColumn(null);
        };

        const addColumn = () => {
          const newColId = `col${currentColumns.length + 1}`;
          const newColumns = [...currentColumns, { id: newColId, label: `Column ${currentColumns.length + 1}`, type: "text" }];
          const newRows = currentRows.map(row => ({ ...row, [newColId]: "New Data" }));
          updateTableData(newColumns, newRows);
        };

        // Initialize individual column widths and row heights
        const defaultColumnWidth = 120;
        const defaultRowHeight = 40;
        const columnWidths = component.columnWidths || currentColumns.map(() => defaultColumnWidth);
        const rowHeights = component.rowHeights || (component.showHeader !== false ? [defaultRowHeight, ...currentRows.map(() => defaultRowHeight)] : currentRows.map(() => defaultRowHeight));
        
        // State for drag operations
        const [isDragging, setIsDragging] = React.useState<{ type: 'column' | 'row', index: number } | null>(null);
        const [startPos, setStartPos] = React.useState<{ x: number, y: number }>({ x: 0, y: 0 });
        const [startSize, setStartSize] = React.useState(0);
        
        // Mouse event handlers for resizing
        const handleMouseDown = (e: React.MouseEvent, type: 'column' | 'row', index: number) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging({ type, index });
          setStartPos({ x: e.clientX, y: e.clientY });
          setStartSize(type === 'column' ? columnWidths[index] : rowHeights[index]);
        };
        
        const handleMouseMove = React.useCallback((e: MouseEvent) => {
          if (!isDragging) return;
          
          const deltaX = e.clientX - startPos.x;
          const deltaY = e.clientY - startPos.y;
          
          if (isDragging.type === 'column') {
            const newWidth = Math.max(50, startSize + deltaX);
            const newColumnWidths = [...columnWidths];
            newColumnWidths[isDragging.index] = newWidth;
            updateTableProps({ columnWidths: newColumnWidths });
          } else {
            const newHeight = Math.max(20, startSize + deltaY);
            const newRowHeights = [...rowHeights];
            newRowHeights[isDragging.index] = newHeight;
            updateTableProps({ rowHeights: newRowHeights });
          }
        }, [isDragging, startPos, startSize, columnWidths, rowHeights, updateTableProps]);
        
        const handleMouseUp = React.useCallback(() => {
          setIsDragging(null);
        }, []);
        
        // Add global mouse event listeners
        React.useEffect(() => {
          if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
          }
        }, [isDragging, handleMouseMove, handleMouseUp]);

        // Get table styling properties
        const showBorders = component.showBorders !== false;
        const borderStyle = component.borderStyle || 'solid';
        const borderColor = component.tableBorderColor || '#d1d5db';
        const borderWidth = showBorders ? '1px' : '0px';
        const borderCSS = showBorders ? `${borderWidth} ${borderStyle} ${borderColor}` : 'none';
        
        const headerBgColor = component.headerBackgroundColor || '#f9fafb';
        const headerTextColor = component.headerTextColor || '#111827';
        const alternateRows = component.alternateRowColors || false;
        const evenRowColor = component.evenRowColor || '#ffffff';
        const oddRowColor = component.oddRowColor || '#f9fafb';
        
        // Table functionality properties
        const showRowNumbers = component.showRowNumbers || false;
        const fixedHeader = component.fixedHeader || false;

        return (
          <div ref={tableRef} className="block relative overflow-hidden" style={{ width: '100%', height: '100%' }}>
            {/* Header Row */}
            {component.showHeader !== false && (
              <div 
                className={`grid gap-0 ${fixedHeader ? 'sticky top-0 z-20' : ''}`} 
                style={{ 
                  gridTemplateColumns: `repeat(${currentColumns.length}, 1fr)`,
                  marginLeft: showRowNumbers ? '32px' : '0',
                  width: '100%'
                }}
              >
                {currentColumns.map((col, colIndex) => (
                  <div 
                    key={col.id} 
                    className="text-sm font-medium p-2 break-words overflow-wrap-anywhere"
                    style={{
                      height: `${Math.min(rowHeights[0] || 40, component.size.height / (currentRows.length + 1))}px`,
                      backgroundColor: headerBgColor,
                      color: headerTextColor,
                      borderRight: colIndex < currentColumns.length - 1 ? borderCSS : 'none',
                      borderBottom: showBorders ? borderCSS : 'none',
                      textAlign: (col as any).alignment || 'left',
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} 
                  >
                    {editingColumn === col.id ? (
                      <input
                        type="text"
                        defaultValue={col.label}
                        className="bg-transparent border-none outline-none w-full"
                        onBlur={(e) => handleColumnEdit(col.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleColumnEdit(col.id, e.currentTarget.value);
                          }
                          if (e.key === "Escape") {
                            setEditingColumn(null);
                          }
                        }}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingColumn(col.id);
                        }}
                        className="cursor-pointer hover:bg-muted/50 px-1 py-1 rounded"
                        title="Click to edit column name"
                      >
                        {col.label}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Data Rows */}
            {currentRows.map((row, rowIndex) => {
              const isEvenRow = rowIndex % 2 === 0;
              const rowBgColor = alternateRows ? (isEvenRow ? evenRowColor : oddRowColor) : '#ffff8f';
              
              return (
                <div key={rowIndex} className="relative">
                  {/* Row Number */}
                  {showRowNumbers && (
                    <div 
                      className="absolute left-0 w-8 text-xs p-1 text-center border-r border-b"
                      style={{
                        height: `${rowHeights[component.showHeader !== false ? rowIndex + 1 : rowIndex]}px`,
                        backgroundColor: rowBgColor,
                        borderColor: borderColor,
                        borderStyle: borderStyle,
                        lineHeight: `${rowHeights[component.showHeader !== false ? rowIndex + 1 : rowIndex] - 8}px`
                      }}
                    >
                      {rowIndex + 1}
                    </div>
                  )}
                  
                  <div 
                    className="grid gap-0" 
                    style={{ 
                      gridTemplateColumns: `repeat(${currentColumns.length}, 1fr)`,
                      marginLeft: showRowNumbers ? '32px' : '0',
                      width: '100%'
                    }}
                  >
                    {currentColumns.map((col, colIndex) => (
                      <div 
                        key={col.id} 
                        className="text-sm p-2"
                        style={{
                          height: `${Math.min(rowHeights[component.showHeader !== false ? rowIndex + 1 : rowIndex] || 40, component.size.height / (currentRows.length + 1))}px`,
                          backgroundColor: rowBgColor,
                          borderRight: colIndex < currentColumns.length - 1 ? borderCSS : 'none',
                          borderBottom: rowIndex < currentRows.length - 1 ? borderCSS : 'none',
                          textAlign: (col as any).alignment || 'left',
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {editingCell?.row === rowIndex && editingCell?.col === col.id ? (
                          <input
                            type="text"
                            defaultValue={(row as any)[col.id] || ""}
                            className="bg-transparent border-none outline-none w-full"
                            onBlur={(e) => handleCellEdit(rowIndex, col.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleCellEdit(rowIndex, col.id, e.currentTarget.value);
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              }
                            }}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              if (component.allowEdit) {
                                setEditingCell({ row: rowIndex, col: col.id });
                              }
                            }}
                            className={`${component.allowEdit ? 'cursor-pointer hover:bg-muted/20 px-1 py-1 rounded' : ''}`}
                            title={component.allowEdit ? "Click to edit cell" : undefined}
                          >
                            {(row as any)[col.id] || ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Resize handles removed - table now fits container size */}
          </div>
        );

      case "chart":
        // Get data from the source table
        const sourceTable = component.dataSource ? 
          components?.find((comp: FormComponent) => comp.id === component.dataSource && comp.type === 'table') : null;
        
        const hasValidData = sourceTable && component.xAxis && component.yAxis && 
          sourceTable.columns && sourceTable.rows;
        
        if (hasValidData) {
          // Render a simple visual chart
          const chartData = sourceTable.rows?.map((row: any) => ({
            x: row[component.xAxis || ''] || '0',
            y: parseFloat(String(row[component.yAxis || ''] || '0')) || 0
          })) || [];
          
          const maxValue = Math.max(...chartData.map((d: any) => d.y), 1);
          const minValue = Math.min(...chartData.map((d: any) => d.y), 0);
          
          // Format value function
          const formatValue = (value: number) => {
            const decimals = component.decimalPlaces || 0;
            const formatted = value.toFixed(decimals);
            
            switch (component.dataFormat) {
              case 'currency':
                return `$${formatted}`;
              case 'percentage':
                return `${formatted}%`;
              default:
                return formatted;
            }
          };
          
          const backgroundColor = component.backgroundColor || '#f9fafb';
          const borderColor = component.chartBorderColor || '#e5e7eb';
          const showGrid = component.showGrid !== false;
          const gridColor = component.gridColor || '#e5e7eb';
          const showAxisLabels = component.showAxisLabels !== false;
          const title = component.title || component.chartType || '';
          const xAxisTitle = component.xAxisTitle || component.xAxis;
          const yAxisTitle = component.yAxisTitle || component.yAxis;
          
          return (
            <div 
              className="w-full h-full rounded border relative"
              style={{ 
                backgroundColor,
                borderColor,
                borderWidth: '1px',
                borderStyle: 'solid',
                width: '100%',
                height: '100%',
                padding: '32px 16px 48px 32px'  // padding top right bottom left
              }}
            >
              {/* Chart Title */}
              {title && (
                <div className="absolute top-2 left-2 text-xs font-medium text-gray-600">
                  {title}
                </div>
              )}
              
              {/* Y-Axis Label */}
              {showAxisLabels && yAxisTitle && (
                <div className="absolute left-2 top-1/2 -rotate-90 text-xs text-gray-600 font-medium whitespace-nowrap">
                  {yAxisTitle}
                </div>
              )}
              
              {/* Y-Axis Numbers */}
              {showAxisLabels && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <div 
                  key={ratio}
                  className="absolute left-2 text-xs text-gray-600"
                  style={{ 
                    bottom: `${12 + (ratio * (100 - 20))}%`, 
                    transform: 'translateY(50%)' 
                  }}
                >
                  {formatValue(minValue + (maxValue - minValue) * ratio)}
                </div>
              ))}
              
              {/* Chart Area with Coordinate System */}
              <div 
                className="relative w-full h-full border-l-2 border-b-2"
                style={{ borderColor: gridColor }}
              >
                {/* Y-Axis Grid Lines */}
                {showGrid && [0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                  <div key={ratio} className="absolute w-full">
                    <div 
                      className="absolute left-0 w-full border-t"
                      style={{ 
                        bottom: `${ratio * 100}%`,
                        borderColor: gridColor
                      }}
                    />
                  </div>
                ))}
                
                {/* Bar Chart */}
                {component.chartType === 'bar' && (
                  <div className="absolute bottom-0 left-0 w-full flex items-end">
                    {chartData.map((data: any, index: number) => {
                      const height = maxValue > 0 ? Math.max(2, ((data.y - minValue) / (maxValue - minValue)) * 80) : 2;
                      const barColor = component.colors?.[index % (component.colors?.length || 1)] || '#3b82f6';
                      
                      return (
                        <div 
                          key={index}
                          className="flex-1 mx-1 relative group"
                        >
                          <div
                            className="w-full transition-colors hover:opacity-80"
                            style={{
                              height: `${height}%`,
                              backgroundColor: barColor,
                              minHeight: '2px'
                            }}
                            title={`${data.x}: ${formatValue(data.y)}`}
                          />
                          
                          {/* Show values on bars if enabled */}
                          {component.showValues && (
                            <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap">
                              {formatValue(data.y)}
                            </div>
                          )}
                          
                          {/* X-axis labels */}
                          {showAxisLabels && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 whitespace-nowrap max-w-[60px] overflow-hidden text-ellipsis">
                              {String(data.x)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Line Chart */}
                {component.chartType === 'line' && (
                  <svg className="absolute inset-0 w-full h-full">
                    {chartData.map((data: any, index: number) => {
                      if (index === 0) return null;
                      
                      const prevData = chartData[index - 1];
                      const x1 = ((index - 1) / (chartData.length - 1)) * 100;
                      const x2 = (index / (chartData.length - 1)) * 100;
                      const y1 = 100 - (maxValue > 0 ? ((prevData.y - minValue) / (maxValue - minValue)) * 80 : 0);
                      const y2 = 100 - (maxValue > 0 ? ((data.y - minValue) / (maxValue - minValue)) * 80 : 0);
                      
                      return (
                        <line
                          key={index}
                          x1={`${x1}%`}
                          y1={`${y1}%`}
                          x2={`${x2}%`}
                          y2={`${y2}%`}
                          stroke={component.colors?.[0] || '#3b82f6'}
                          strokeWidth="2"
                        />
                      );
                    })}
                    
                    {/* Data points */}
                    {chartData.map((data: any, index: number) => {
                      const x = (index / (chartData.length - 1)) * 100;
                      const y = 100 - (maxValue > 0 ? ((data.y - minValue) / (maxValue - minValue)) * 80 : 0);
                      
                      return (
                        <circle
                          key={index}
                          cx={`${x}%`}
                          cy={`${y}%`}
                          r="3"
                          fill={component.colors?.[0] || '#3b82f6'}
                        >
                          <title>{`${data.x}: ${formatValue(data.y)}`}</title>
                        </circle>
                      );
                    })}
                  </svg>
                )}
                
                {/* Area Chart */}
                {component.chartType === 'area' && (
                  <svg className="absolute inset-0 w-full h-full">
                    {/* Create area path */}
                    <defs>
                      <linearGradient id={`gradient-${component.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: component.colors?.[0] || '#3b82f6', stopOpacity: 0.6 }} />
                        <stop offset="100%" style={{ stopColor: component.colors?.[0] || '#3b82f6', stopOpacity: 0.1 }} />
                      </linearGradient>
                    </defs>
                    
                    <path
                      d={`M 0,100% ${chartData.map((data: any, index: number) => {
                        const x = (index / (chartData.length - 1)) * 100;
                        const y = 100 - (maxValue > 0 ? ((data.y - minValue) / (maxValue - minValue)) * 80 : 0);
                        return `L ${x}%,${y}%`;
                      }).join(' ')} L 100%,100% Z`}
                      fill={`url(#gradient-${component.id})`}
                      stroke={component.colors?.[0] || '#3b82f6'}
                      strokeWidth="2"
                    />
                  </svg>
                )}
              </div>
              
              {/* X-Axis Label */}
              {showAxisLabels && xAxisTitle && (
                <div className="text-center mt-2 text-xs text-gray-600 font-medium">
                  {xAxisTitle}
                </div>
              )}
            </div>
          );
        }
        
        // Default placeholder when not configured
        return (
          <div className="w-full h-full flex items-center justify-center text-center">
            <div>
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {component.chartType || ""}
                {component.dataSource && (
                  <span className="block text-xs mt-1">
                    Source: Table {allComponents?.find((c: FormComponent) => c.id === component.dataSource)?.label || component.dataSource}
                  </span>
                )}
                {!component.dataSource && (
                  <span className="block text-xs mt-1">Configure data source and axes</span>
                )}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${component.rotation || 0}deg)`,
      }
    : {
        transform: `translate3d(${component.position.x}px, ${component.position.y}px, 0) rotate(${component.rotation || 0}deg)`,
      };

  return (
    <div 
      className="relative group"
      style={{
        padding: '40px 50px 20px 20px', // Larger padding to extend hover area around buttons
        margin: '-40px -50px -20px -20px', // Negative margin to compensate
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={setNodeRef}
        style={{
          ...style,
          backgroundColor: '#ffff8f',
          ...(component.type === 'table' || component.type === 'chart' ? { 
            width: component.size.width, 
            height: component.size.height,
            minWidth: 'auto',
            minHeight: 'auto' 
          } : { width: component.size.width, height: component.size.height }),
        }}
        className={`form-component absolute border-2 border-dashed rounded ${component.type === 'table' || component.type === 'chart' ? '' : 'p-3'} transition-colors ${
          isSelected || isMultiSelected
            ? "border-primary bg-primary/10 z-20 shadow-lg"
            : isDragging || isResizing
              ? "z-20 shadow-lg border-cyan-300"
              : "border-cyan-300 hover:border-cyan-400 z-10"
        }`}
        onClick={(e) => {
          // Always trigger selection when clicking on component
          onClick?.(component.id, e);
        }}
        onMouseDown={(e) => {
          // Chỉ cho phép selection, không drag khi click vào component body
          if (!isAltPressed) {
            onClick?.(component.id, e);
          }
        }}
        data-testid={`preview-component-${component.id}`}
      >

        {/* Component Content */}
        {renderInput()}

        {/* Controls - always rendered but visibility controlled by CSS */}
        <div 
          className={`absolute -top-8 right-0 flex space-x-1 transition-opacity duration-200 ${
            isSelected 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100'
          }`}
        >
            {/* Drag Handle */}
            <Button
              variant="outline"
              size="sm"
              className="p-1 h-6 w-6 bg-white border cursor-move"
              onMouseDown={handleDragMouseDown}
              title="Drag to move"
            >
              <Move className="h-3 w-3" />
            </Button>

            {/* Rotation Handle */}
            {onRotate && (
              <Button
                variant="outline"
                size="sm"
                className={`p-1 h-6 w-6 border cursor-crosshair transition-colors ${
                  isRotating 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-white border-gray-300 hover:bg-gray-50'
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  
                  setIsRotating(true);
                  
                  // Get component center position
                  const componentEl = e.currentTarget.closest('.form-component') as HTMLElement;
                  if (!componentEl) return;
                  
                  const componentRect = componentEl.getBoundingClientRect();
                  const centerX = componentRect.left + componentRect.width / 2;
                  const centerY = componentRect.top + componentRect.height / 2;
                  
                  // Initial mouse position and rotation
                  const startMouseX = e.clientX;
                  const startMouseY = e.clientY;
                  const startRotation = component.rotation || 0;
                  
                  // Calculate initial angle from center to mouse
                  const startAngle = Math.atan2(startMouseY - centerY, startMouseX - centerX) * (180 / Math.PI);
                  
                  const handleMouseMove = (moveEvent: MouseEvent) => {
                    // Calculate current angle from center to mouse
                    const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI);
                    
                    // Calculate the angle difference
                    let angleDiff = currentAngle - startAngle;
                    
                    // Normalize angle difference to -180 to 180
                    while (angleDiff > 180) angleDiff -= 360;
                    while (angleDiff < -180) angleDiff += 360;
                    
                    // Apply rotation
                    const newRotation = (startRotation + angleDiff) % 360;
                    onRotate(component.id, newRotation < 0 ? newRotation + 360 : newRotation);
                  };
                  
                  const handleMouseUp = () => {
                    setIsRotating(false);
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                    document.body.style.cursor = '';
                  };
                  
                  // Set cursor and add listeners
                  document.body.style.cursor = 'crosshair';
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                }}
                title={isRotating ? "Rotating..." : "Click to rotate 15° or hold to rotate continuously"}
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            )}

            {/* Delete Button */}
            <Button
              variant="outline"
              size="sm"
              className="p-1 h-6 w-6 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              title="Delete component"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
        </div>

        {/* Resize Handles - always rendered but visibility controlled by CSS */}
        {RESIZABLE_FIELD_TYPES.includes(component.type) && (
          <div className={`${
            isSelected 
              ? 'opacity-100' 
              : 'opacity-0 group-hover:opacity-100'
          } transition-opacity duration-200`}>
              <div
                className="absolute -bottom-1 -right-1 w-2 h-2 bg-primary border border-white rounded cursor-se-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "se")}
                title="Resize"
              />
              <div
                className="absolute -top-1 -right-1 w-2 h-2 bg-primary border border-white rounded cursor-ne-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
                title="Resize"
              />
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-primary border border-white rounded cursor-sw-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
                title="Resize"
              />
              <div
                className="absolute -top-1 -left-1 w-2 h-2 bg-primary border border-white rounded cursor-nw-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
                title="Resize"
              />
              <div
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary border border-white rounded cursor-n-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "n")}
                title="Resize"
              />
              <div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary border border-white rounded cursor-s-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "s")}
                title="Resize"
              />
              <div
                className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary border border-white rounded cursor-e-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "e")}
                title="Resize"
              />
              <div
                className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary border border-white rounded cursor-w-resize"
                onMouseDown={(e) => handleResizeMouseDown(e, "w")}
                title="Resize"
              />
          </div>
        )}
      </div>
    </div>
  );
}

export default function FormPreview({
  components,
  onRemoveComponent,
  onComponentClick,
  selectedComponentId,
  selectedComponentIds = [],
  imageFile,
  onUpdateComponent,
  zoom = 1,
  onSelectionStart,
  isSelecting,
  selectionBox,
  isComponentPaletteCollapsed = false,
  onToggleComponentPalette,
}: FormPreviewProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-preview",
    data: {
      type: "form-preview",
    },
  });

  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [isAltPressed, setIsAltPressed] = useState(false);

  // Handle Alt key press/release for component selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false);
      }
    };

    const handleBlur = () => {
      setIsAltPressed(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [isAltPressed]);

  const handleMoveComponent = (id: string, x: number, y: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map((comp) =>
      comp.id === id ? { ...comp, position: { x, y } } : comp,
    );
    onUpdateComponent(updatedComponents);
  };

  const handleResizeComponent = (id: string, width: number, height: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map((comp) =>
      comp.id === id ? { ...comp, size: { width, height } } : comp,
    );
    onUpdateComponent(updatedComponents);
  };

  const handleResizeAndMoveComponent = (
    id: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map((comp) =>
      comp.id === id
        ? { ...comp, position: { x, y }, size: { width, height } }
        : comp,
    );
    onUpdateComponent(updatedComponents);
  };

  const handleRotateComponent = (id: string, rotation: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map((comp) =>
      comp.id === id ? { ...comp, rotation } : comp,
    );
    onUpdateComponent(updatedComponents);
  };

  const handleUpdateComponent = (id: string, updates: Partial<FormComponent>) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map((comp) =>
      comp.id === id ? { ...comp, ...updates } : comp,
    );
    onUpdateComponent(updatedComponents);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex-1">
        {imageFile ? (
          <div className="h-full min-h-[500px] relative">
            <ImageBackground 
              file={imageFile}
              componentPalette={onToggleComponentPalette && (
                <ComponentPalette
                  onToggleCollapse={onToggleComponentPalette}
                  floating={true}
                />
              )}
            >
              <div
                ref={setNodeRef}
                className={`w-full h-full pointer-events-auto transition-colors ${
                  isOver ? "bg-primary/5" : ""
                } ${isAltPressed ? "cursor-default" : "cursor-default"}`}
                data-testid="form-preview-area"
                onMouseDown={(e) => {
                  onSelectionStart?.(e);
                }}
              >
                {components.length === 0
                  ? null
                  : components.map((component) => (
                      <PreviewComponent
                        key={component.id}
                        component={component}
                        onRemove={() => onRemoveComponent(component.id)}
                        onMove={handleMoveComponent}
                        onResize={handleResizeComponent}
                        onResizeAndMove={handleResizeAndMoveComponent}
                        onRotate={handleRotateComponent}
                        onClick={onComponentClick}
                        isSelected={selectedComponentId === component.id}
                        isMultiSelected={
                          selectedComponentIds.includes(component.id) &&
                          selectedComponentId !== component.id
                        }
                        zoom={zoom}
                        isAltPressed={isAltPressed}
                        fieldValues={fieldValues}
                        onFieldChange={(componentId, value) =>
                          setFieldValues((prev) => ({
                            ...prev,
                            [componentId]: value,
                          }))
                        }
                        onUpdateComponent={handleUpdateComponent}
                        components={components}
                        allComponents={components}
                      />
                    ))}

                {/* Selection Box */}
                {isSelecting && selectionBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: Math.min(selectionBox.startX, selectionBox.endX),
                      top: Math.min(selectionBox.startY, selectionBox.endY),
                      width: Math.abs(selectionBox.endX - selectionBox.startX),
                      height: Math.abs(selectionBox.endY - selectionBox.startY),
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid #3b82f6",
                      pointerEvents: "none",
                      zIndex: 999,
                    }}
                  />
                )}
              </div>
            </ImageBackground>
          </div>
        ) : (
          <div
            ref={setNodeRef}
            className={`w-full h-full min-h-[500px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center transition-colors ${
              isOver ? "bg-primary/5 border-primary" : ""
            } ${isAltPressed ? "cursor-default" : "cursor-default"}`}
            data-testid="form-preview-area"
            onMouseDown={(e) => {
              onSelectionStart?.(e);
            }}
          >
            {components.length === 0 ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <GripVertical className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {imageFile ? "Add components to your form" : "Drop form components here"}
                </h3>
                <p className="text-gray-500 max-w-sm">
                  {imageFile 
                    ? "Use the floating component palette to add and position components on your background image."
                    : "Upload a background image to enable the floating component palette and start building your form."
                  }
                </p>
              </div>
            ) : (
              <>
                {components.map((component) => (
                  <PreviewComponent
                    key={component.id}
                    component={component}
                    onRemove={() => onRemoveComponent(component.id)}
                    onMove={handleMoveComponent}
                    onResize={handleResizeComponent}
                    onResizeAndMove={handleResizeAndMoveComponent}
                    onRotate={handleRotateComponent}
                    onClick={onComponentClick}
                    isSelected={selectedComponentId === component.id}
                    isMultiSelected={selectedComponentIds.includes(component.id)}
                    zoom={zoom}
                    fieldValues={fieldValues}
                    onFieldChange={(componentId, value) =>
                      setFieldValues((prev) => ({
                        ...prev,
                        [componentId]: value,
                      }))
                    }
                    onUpdateComponent={handleUpdateComponent}
                    components={components}
                    allComponents={components}
                  />
                ))}

                {/* Selection Box */}
                {isSelecting && selectionBox && (
                  <div
                    style={{
                      position: "absolute",
                      left: Math.min(selectionBox.startX, selectionBox.endX),
                      top: Math.min(selectionBox.startY, selectionBox.endY),
                      width: Math.abs(selectionBox.endX - selectionBox.startX),
                      height: Math.abs(selectionBox.endY - selectionBox.startY),
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid #3b82f6",
                      pointerEvents: "none",
                      zIndex: 999,
                    }}
                  />
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}