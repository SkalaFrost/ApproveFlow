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
}

// Danh sách các field type có thể resize
const RESIZABLE_FIELD_TYPES = ["textarea", "text", "number", "table"];

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

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `component-${component.id}`,
    data: {
      type: "form-component",
      component,
    },
    disabled: isAltPressed, // Disable dragging when Alt is pressed
  });

  const handleDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.altKey || isAltPressed) return;

    setIsDragging(true);
    // Set cursor to grabbing during drag
    document.body.style.cursor = "grabbing";

    const componentElement = e.currentTarget.closest(
      ".form-component",
    ) as HTMLElement;
    if (!componentElement) return;

    // Calculate offset from the component's current position, not from the button
    const rect = componentElement.getBoundingClientRect();
    const canvas = document.querySelector('[data-testid="form-preview-area"]');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    const offsetX = (e.clientX - rect.left) / zoom;
    const offsetY = (e.clientY - rect.top) / zoom;

    const handleMouseMove = (e: MouseEvent) => {
      const newX = Math.max(0, (e.clientX - canvasRect.left) / zoom - offsetX);
      const newY = Math.max(0, (e.clientY - canvasRect.top) / zoom - offsetY);
      onMove(component.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Reset cursor
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleRotateMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.altKey || isAltPressed) return;

    // Set cursor to crosshair during rotation
    document.body.style.cursor = "crosshair";

    const componentElement = e.currentTarget.closest(
      ".form-component",
    ) as HTMLElement;
    if (!componentElement) return;

    const rect = componentElement.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = component.rotation || 0;

    const handleMouseMove = (e: MouseEvent) => {
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      const deltaAngle = (currentAngle - startAngle) * (180 / Math.PI);
      const newRotation = (startRotation + deltaAngle) % 360;

      onRotate?.(component.id, newRotation);
    };

    const handleMouseUp = () => {
      // Reset cursor
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    // Không cho phép resize khi đang pan (Alt pressed)
    if (e.altKey || isAltPressed) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    e.stopPropagation();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = component.size.width;
    const startHeight = component.size.height;
    const startPosX = component.position.x;
    const startPosY = component.position.y;

    const handleResizeMove = (e: MouseEvent) => {
      const deltaX = (e.clientX - startX) / zoom;
      const deltaY = (e.clientY - startY) / zoom;

      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;
      let positionChanged = false;

      switch (direction) {
        case "se": // Southeast - chỉ thay đổi kích thước
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case "sw": // Southwest - thay đổi X position
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          newX = startPosX + (startWidth - newWidth);
          positionChanged = true;
          break;
        case "ne": // Northeast - thay đổi Y position
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case "nw": // Northwest - thay đổi cả X và Y position
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newX = startPosX + (startWidth - newWidth);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case "e": // East - chỉ thay đổi chiều rộng
          newWidth = Math.max(100, startWidth + deltaX);
          break;
        case "w": // West - thay đổi chiều rộng và X position
          newWidth = Math.max(100, startWidth - deltaX);
          newX = startPosX + (startWidth - newWidth);
          positionChanged = true;
          break;
        case "n": // North - thay đổi chiều cao và Y position
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case "s": // South - chỉ thay đổi chiều cao
          newHeight = Math.max(40, startHeight + deltaY);
          break;
      }

      // For table components, scale row heights and column widths proportionally
      if (component.type === 'table' && onUpdateComponent) {
        const oldWidth = startWidth;
        const oldHeight = startHeight;
        const widthRatio = newWidth / oldWidth;
        const heightRatio = newHeight / oldHeight;
        
        // Scale column widths proportionally
        const cols = component.columns || defaultColumns;
        const rows = component.rows || defaultRows;
        const currentColumnWidths = component.columnWidths || cols.map(() => 120);
        const newColumnWidths = currentColumnWidths.map(width => Math.max(50, width * widthRatio));
        
        // Scale row heights proportionally  
        const currentRowHeights = component.rowHeights || (component.showHeader !== false ? [40, ...rows.map(() => 40)] : rows.map(() => 40));
        const newRowHeights = currentRowHeights.map(height => Math.max(20, height * heightRatio));
        
        const updates: Partial<FormComponent> = {
          size: { width: newWidth, height: newHeight },
          columnWidths: newColumnWidths,
          rowHeights: newRowHeights
        };
        
        if (positionChanged) {
          updates.position = { x: Math.max(0, newX), y: Math.max(0, newY) };
        }
        
        onUpdateComponent(component.id, updates);
      } else {
        // Regular component resizing
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
            placeholder={
              component.placeholder || `Enter ${component.label.toLowerCase()}`
            }
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

        // Auto-resize function
        const autoResize = (textarea: HTMLTextAreaElement) => {
          textarea.style.height = "auto";
          textarea.style.height = Math.max(textarea.scrollHeight, 60) + "px";

          // Update parent container height
          const container = textarea.closest(".form-component") as HTMLElement;
          if (container) {
            const newHeight = Math.max(
              textarea.scrollHeight + 24,
              component.size.height,
            ); // +24 for padding
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
            placeholder={
              component.placeholder || `Enter ${component.label.toLowerCase()}`
            }
            required={component.required}
            value={fieldValues[component.id] || ""}
            onChange={(e) => {
              handleFieldChange(e.target.value);
              autoResize(e.target);
            }}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none resize-none overflow-hidden [&::-webkit-scrollbar]:hidden"
            style={{
              height: "auto",
              minHeight: "60px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          />
        );
      case "number":
        return (
          <Input
            type="number"
            placeholder={component.placeholder || "0"}
            required={component.required}
            value={fieldValues[component.id] || ""}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
          />
        );
      case "date":
        return (
          <Input
            type="date"
            required={component.required}
            value={fieldValues[component.id] || ""}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full h-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-center flex items-center justify-center [&::-webkit-calendar-picker-indicator]:bg-transparent"
          />
        );
      case "select":
        return (
          <Select
            required={component.required}
            value={fieldValues[component.id] || undefined}
            onValueChange={handleFieldChange}
          >
            <SelectTrigger
              onClick={handleFieldClick}
              className="border-0 rounded-none bg-transparent w-full h-full text-center focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none"
            >
              <SelectValue
                placeholder={component.placeholder || "Select an option"}
              />
            </SelectTrigger>
            <SelectContent>
              {component.options && component.options.length > 0 ? (
                component.options
                  .filter((option) => option && option.trim() !== "")
                  .map((option, index) => (
                    <SelectItem key={index} value={option.trim()}>
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
        const [editingColumn, setEditingColumn] = React.useState<string | null>(
          null,
        );


        const currentColumns = component.columns || defaultColumns;
        const currentRows = component.rows || defaultRows;

        // Auto-resize table container to match content exactly
        const autoResizeTable = () => {
          if (tableRef.current && !isResizing) {
            // Calculate exact total height from row heights
            const totalHeight = rowHeights.reduce((sum, height) => sum + height, 0);
            // Calculate exact total width from column widths  
            const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
            
            // Update component size to exactly match table content
            if (onUpdateComponent) {
              onUpdateComponent(component.id, {
                size: {
                  width: totalWidth,
                  height: totalHeight
                }
              });
            }
          }
        };

        React.useEffect(() => {
          autoResizeTable();
        }, [component.columns, component.rows, component.columnWidths, component.rowHeights]);

        // Update component data (simplified - just update the component directly)
        const updateTableData = (newColumns?: any[], newRows?: any[]) => {
          // For now, we'll just store the data in component state
          // In a real implementation, you'd want to update the parent state
          component.columns = newColumns || component.columns;
          component.rows = newRows || component.rows;
        };
        
        // Update component properties
        const updateTableProps = (props: Partial<FormComponent>) => {
          if (onUpdateComponent) {
            onUpdateComponent(component.id, props);
          } else {
            // Fallback: update component directly
            Object.assign(component, props);
          }
        };

        // Edit column name
        const handleColumnEdit = (columnId: string, newLabel: string) => {
          const newColumns = currentColumns.map((col) =>
            col.id === columnId ? { ...col, label: newLabel } : col,
          );
          updateTableData(newColumns, currentRows);
          setEditingColumn(null);
        };

        // Edit cell data
        const handleCellEdit = (
          rowIndex: number,
          columnId: string,
          newValue: string,
        ) => {
          const newRows = [...currentRows];
          newRows[rowIndex] = { ...newRows[rowIndex], [columnId]: newValue };
          updateTableData(currentColumns, newRows);
          setEditingCell(null);
        };

        // Add new row
        const addNewRow = () => {
          const newRow: any = {};
          currentColumns.forEach((col) => {
            newRow[col.id] = `New ${col.label}`;
          });
          const newRows = [...currentRows, newRow];
          updateTableData(currentColumns, newRows);
        };

        // Add new column
        const addNewColumn = () => {
          const newColId = `col${currentColumns.length + 1}`;
          const newColumns = [
            ...currentColumns,
            {
              id: newColId,
              label: `Column ${currentColumns.length + 1}`,
              type: "text",
            },
          ];
          const newRows = currentRows.map((row) => ({
            ...row,
            [newColId]: "New Data",
          }));
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
        const showBorders = component.showBorders !== false;
        const borderStyle = showBorders ? '1px dashed #d1d5db' : 'none';
        
        return (
          <div ref={tableRef} className="inline-block relative w-full h-full">
            {/* Header Row - conditional */}
            {component.showHeader !== false && (
              <div className="grid gap-0 bg-muted/50" style={{ gridTemplateColumns: columnWidths.map(w => `${w}px`).join(' ') }}>
                {currentColumns.map((col, colIndex) => (
                  <div 
                    key={col.id} 
                    className="text-sm font-medium p-2 break-words overflow-wrap-anywhere"
                    style={{
                      height: `${rowHeights[0]}px`,
                      borderRight: colIndex < currentColumns.length - 1 ? borderStyle : 'none',
                      borderBottom: showBorders ? borderStyle : 'none'
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
            {currentRows.map((row, rowIndex) => (
              <div key={rowIndex} className="grid gap-0" style={{ gridTemplateColumns: columnWidths.map(w => `${w}px`).join(' ') }}>
                {currentColumns.map((col, colIndex) => (
                  <div 
                    key={col.id} 
                    className="text-sm p-2 break-words overflow-wrap-anywhere"
                    style={{
                      height: `${rowHeights[component.showHeader !== false ? rowIndex + 1 : rowIndex]}px`,
                      borderRight: colIndex < currentColumns.length - 1 ? borderStyle : 'none',
                      borderBottom: rowIndex < currentRows.length - 1 ? borderStyle : 'none'
                    }}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === col.id ? (
                      <input
                        type="text"
                        defaultValue={(row as any)[col.id] || ""}
                        className="bg-transparent border border-gray-300 rounded px-1 py-1 w-full text-sm"
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
                          setEditingCell({ row: rowIndex, col: col.id });
                        }}
                        className="cursor-pointer hover:bg-muted/50 px-1 py-1 rounded block min-h-[20px] break-words overflow-wrap-anywhere"
                        title="Click to edit cell"
                      >
                        {(row as any)[col.id] || "-"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
            
            {/* Column Resize Handles */}
            {currentColumns.slice(0, -1).map((_, colIndex) => {
              const leftOffset = columnWidths.slice(0, colIndex + 1).reduce((sum, width) => sum + width, 0);
              const totalHeight = (component.showHeader !== false ? rowHeights[0] : 0) + rowHeights.slice(component.showHeader !== false ? 1 : 0).reduce((sum, height) => sum + height, 0);
              
              return (
                <div
                  key={`col-resize-${colIndex}`}
                  className="absolute bg-transparent hover:bg-blue-300 hover:opacity-50 cursor-col-resize z-10"
                  style={{
                    left: `${leftOffset - 2}px`,
                    top: 0,
                    width: '4px',
                    height: `${totalHeight}px`
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'column', colIndex)}
                  title="Drag to resize column"
                />
              );
            })}
            
            {/* Row Resize Handles */}
            {(component.showHeader !== false ? rowHeights.slice(0, -1) : rowHeights.slice(0, -1)).map((_, rowIndex) => {
              const topOffset = rowHeights.slice(0, rowIndex + 1).reduce((sum, height) => sum + height, 0);
              const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
              
              return (
                <div
                  key={`row-resize-${rowIndex}`}
                  className="absolute bg-transparent hover:bg-blue-300 hover:opacity-50 cursor-row-resize z-10"
                  style={{
                    left: 0,
                    top: `${topOffset - 2}px`,
                    width: `${totalWidth}px`,
                    height: '4px'
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'row', rowIndex)}
                  title="Drag to resize row"
                />
              );
            })}
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
            x: row[component.xAxis || ''] || 0,
            y: parseFloat(row[component.yAxis || '']) || 0
          })) || [];
          
          const maxValue = Math.max(...chartData.map((d: any) => d.y), 1);
          
          return (
            <div className="w-full h-full p-4">
              <div className="w-full h-full bg-gray-50 rounded border relative overflow-hidden">
                {/* Chart Title */}
                <div className="absolute top-2 left-2 text-xs font-medium text-gray-600">
                  {component.chartType || "Bar"} Chart
                </div>
                
                {/* Simple Bar Chart Visualization */}
                {component.chartType === 'bar' || !component.chartType ? (
                  <div className="flex items-end justify-center h-full px-8 pb-8 pt-8 gap-2">
                    {chartData.slice(0, 8).map((data: any, index: number) => (
                      <div key={index} className="flex flex-col items-center gap-1 flex-1 min-w-0">
                        <div 
                          className="bg-blue-500 rounded-sm w-full min-h-[4px]"
                          style={{ height: `${(data.y / maxValue) * 60}%` }}
                          title={`${data.x}: ${data.y}`}
                        />
                        <div className="text-xs text-gray-600 truncate w-full text-center">
                          {String(data.x).slice(0, 8)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <BarChart3 className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="text-xs text-gray-600">
                        {component.chartType} Chart Preview
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
        
        // Default placeholder when not configured
        return (
          <div className="w-full h-full flex items-center justify-center text-center">
            <div>
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {component.chartType || "Bar"} Chart
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
    <div className="relative group">
      <div
        ref={setNodeRef}
        style={{
          ...style,
          ...(component.type === 'table' || component.type === 'chart' ? { 
            width: component.size.width, 
            height: component.size.height,
            minWidth: 'auto',
            minHeight: 'auto' 
          } : { width: component.size.width, height: component.size.height }),
        }}
        className={`form-component absolute bg-white border-2 border-dashed rounded ${component.type === 'table' || component.type === 'chart' ? '' : 'p-3'} transition-colors ${
          isSelected
            ? "border-primary bg-primary/10 z-20 shadow-lg"
            : isMultiSelected
              ? "border-blue-400 bg-blue-50 z-15 shadow-md"
              : isDragging || isResizing
                ? "z-20 shadow-lg border-cyan-300"
                : "border-cyan-300 hover:border-cyan-400 z-10"
        }`}
        onMouseDown={(e) => {
          // Chỉ cho phép selection, không drag khi click vào component body
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(component.id, e);
        }}
        data-testid={`form-component-${component.id}`}
        data-component-id={component.id}
      >
        {/* Control buttons - positioned above the form field */}
        <div className="absolute -top-8 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-50">
          {/* Drag handle */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full cursor-grab hover:cursor-grab active:cursor-grabbing shadow-md border border-white"
            onMouseDown={handleDragMouseDown}
            data-testid={`button-drag-${component.id}`}
          >
            <GripVertical className="w-3 h-3" />
          </Button>

          {/* Rotate handle */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full cursor-crosshair shadow-md border border-white"
            onMouseDown={handleRotateMouseDown}
            data-testid={`button-rotate-${component.id}`}
          >
            <RotateCw className="w-3 h-3" />
          </Button>

          {/* Remove button */}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md border border-white"
            onClick={onRemove}
            data-testid={`button-remove-${component.id}`}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        {renderInput()}

        {/* Resize Handles - chỉ hiển thị cho các field có thể resize */}
        {RESIZABLE_FIELD_TYPES.includes(component.type) && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Corner handles */}
            <div
              className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-nw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "nw")}
            />
            <div
              className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-ne-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "ne")}
            />
            <div
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-sw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "sw")}
            />
            <div
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "se")}
            />

            {/* Edge handles */}
            <div
              className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-n-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "n")}
            />
            <div
              className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-s-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "s")}
            />
            <div
              className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-w-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "w")}
            />
            <div
              className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-e-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, "e")}
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
  isSelecting = false,
  selectionBox,
}: FormPreviewProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: "form-preview",
  });

  const [isAltPressed, setIsAltPressed] = useState(false);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Track Alt key for selection mode
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
            <ImageBackground file={imageFile}>
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
                        isAltPressed={isAltPressed}
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
            className={`border-2 border-dashed rounded-lg p-4 h-full min-h-[500px] relative overflow-hidden transition-colors ${
              isOver
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/30"
            } ${isAltPressed ? "cursor-default" : "cursor-default"}`}
            data-testid="form-preview-area"
            onMouseDown={(e) => {
              onSelectionStart?.(e);
            }}
          >
            {components.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-sm">
                  Drag components here to build your form
                </p>
              </div>
            ) : (
              <>
                {components.map((component) => (
                  <PreviewComponent
                    key={component.id}
                    component={component}
                    isAltPressed={isAltPressed}
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
