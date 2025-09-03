import { useState, useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Trash2, Move, BarChart3 } from "lucide-react";
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
const RESIZABLE_FIELD_TYPES = ['textarea', 'text', 'email', 'number'];

function PreviewComponent({ 
  component, 
  onRemove, 
  onMove,
  onResize,
  onResizeAndMove,
  onClick,
  isSelected,
  isMultiSelected,
  zoom = 1,
  isAltPressed = false,
  fieldValues = {},
  onFieldChange
}: { 
  component: FormComponent; 
  onRemove: () => void;
  onMove: (id: string, x: number, y: number) => void;
  onResize: (id: string, width: number, height: number) => void;
  onResizeAndMove: (id: string, x: number, y: number, width: number, height: number) => void;
  onClick?: (id: string, event?: React.MouseEvent) => void;
  isSelected?: boolean;
  isMultiSelected?: boolean;
  zoom?: number;
  isAltPressed?: boolean;
  fieldValues?: Record<string, any>;
  onFieldChange?: (componentId: string, value: any) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `component-${component.id}`,
    data: {
      type: 'form-component',
      component,
    },
    disabled: isAltPressed, // Disable dragging when Alt is pressed
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    // Không cho phép drag component khi đang pan (Alt pressed)
    if (e.altKey || isAltPressed) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    // ⚡ quan trọng: chia cho zoom để offset đúng khi zoom khác 100%
    const offsetX = (e.clientX - rect.left) / zoom;
    const offsetY = (e.clientY - rect.top) / zoom;
    const startPosX = component.position.x;
    const startPosY = component.position.y;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('[data-testid="form-preview-area"]');
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const newX = Math.max(0, (e.clientX - canvasRect.left) / zoom - offsetX);
      const newY = Math.max(0, (e.clientY - canvasRect.top) / zoom - offsetY);
      onMove(component.id, newX, newY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
        case 'se': // Southeast - chỉ thay đổi kích thước
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          break;
        case 'sw': // Southwest - thay đổi X position
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(40, startHeight + deltaY);
          newX = startPosX + (startWidth - newWidth);
          positionChanged = true;
          break;
        case 'ne': // Northeast - thay đổi Y position
          newWidth = Math.max(100, startWidth + deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case 'nw': // Northwest - thay đổi cả X và Y position
          newWidth = Math.max(100, startWidth - deltaX);
          newHeight = Math.max(40, startHeight - deltaY);
          newX = startPosX + (startWidth - newWidth);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case 'e': // East - chỉ thay đổi chiều rộng
          newWidth = Math.max(100, startWidth + deltaX);
          break;
        case 'w': // West - thay đổi chiều rộng và X position
          newWidth = Math.max(100, startWidth - deltaX);
          newX = startPosX + (startWidth - newWidth);
          positionChanged = true;
          break;
        case 'n': // North - thay đổi chiều cao và Y position
          newHeight = Math.max(40, startHeight - deltaY);
          newY = startPosY + (startHeight - newHeight);
          positionChanged = true;
          break;
        case 's': // South - chỉ thay đổi chiều cao
          newHeight = Math.max(40, startHeight + deltaY);
          break;
      }

      if (positionChanged) {
        onResizeAndMove(component.id, Math.max(0, newX), Math.max(0, newY), newWidth, newHeight);
      } else {
        onResize(component.id, newWidth, newHeight);
      }
    };

    const handleResizeUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
    };

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeUp);
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
      case "email":
        return (
          <Input 
            type={component.type}
            placeholder={component.placeholder || `Enter ${component.label.toLowerCase()}`}
            required={component.required}
            value={fieldValues[component.id] || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
          />
        );
      case "textarea":
        return (
          <Textarea 
            placeholder={component.placeholder || `Enter ${component.label.toLowerCase()}`}
            required={component.required}
            value={fieldValues[component.id] || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="min-h-[80px] resize-none"
          />
        );
      case "number":
        return (
          <Input 
            type="number"
            placeholder={component.placeholder || "0"}
            required={component.required}
            value={fieldValues[component.id] || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
          />
        );
      case "date":
        return (
          <Input 
            type="date"
            required={component.required}
            value={fieldValues[component.id] || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
            className="border-0 rounded-none bg-transparent w-full h-full focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none text-center flex items-center justify-center [&::-webkit-calendar-picker-indicator]:bg-transparent [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        );
      case "select":
        return (
          <Select 
            required={component.required}
            value={fieldValues[component.id] || ''}
            onValueChange={handleFieldChange}
          >
            <SelectTrigger onClick={handleFieldClick}>
              <SelectValue placeholder={component.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {component.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              )) || (
                <SelectItem value="option1">Option 1</SelectItem>
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
      case "radio":
        return (
          <div className="space-y-2">
            {component.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id={`${component.id}-${index}`}
                  name={component.id}
                  value={option}
                  checked={fieldValues[component.id] === option}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  onClick={handleFieldClick}
                  className="w-4 h-4 text-primary"
                />
              </div>
            )) || (
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id={component.id}
                  name={component.id}
                  checked={fieldValues[component.id] === 'Option 1'}
                  onChange={() => handleFieldChange('Option 1')}
                  onClick={handleFieldClick}
                  className="w-4 h-4 text-primary"
                />
              </div>
            )}
          </div>
        );
      case "file":
        return (
          <Input 
            type="file"
            required={component.required}
            onChange={(e) => handleFieldChange(e.target.files?.[0] || null)}
            onFocus={handleFieldFocus}
            onClick={handleFieldClick}
          />
        );
      case "table":
        return (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  {(component.columns || [
                    { id: 'col1', label: 'Column 1', type: 'text' },
                    { id: 'col2', label: 'Column 2', type: 'text' },
                    { id: 'col3', label: 'Column 3', type: 'text' }
                  ]).map((col) => (
                    <th key={col.id} className="px-4 py-2 text-left text-sm font-medium">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(component.rows || [
                  { col1: 'Row 1 Data 1', col2: 'Row 1 Data 2', col3: 'Row 1 Data 3' },
                  { col1: 'Row 2 Data 1', col2: 'Row 2 Data 2', col3: 'Row 2 Data 3' }
                ]).map((row, index) => (
                  <tr key={index} className="border-t">
                    {(component.columns || [
                      { id: 'col1', label: 'Column 1', type: 'text' },
                      { id: 'col2', label: 'Column 2', type: 'text' },
                      { id: 'col3', label: 'Column 3', type: 'text' }
                    ]).map((col) => (
                      <td key={col.id} className="px-4 py-2 text-sm">
                        {row[col.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "chart":
        return (
          <div className="border rounded-md p-4 bg-muted/20 min-h-[200px] flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {component.chartType || 'Bar'} Chart
                {component.dataSource && (
                  <span className="block text-xs mt-1">
                    Source: Table {component.dataSource}
                  </span>
                )}
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : {
    transform: `translate3d(${component.position.x}px, ${component.position.y}px, 0)`,
  };

  return (
    <div 
      ref={setNodeRef}
      style={{
        ...style,
        width: component.size.width,
        height: component.size.height
      }}
      className={`form-component group absolute bg-white border-2 border-dashed rounded p-3 transition-colors ${
        isSelected 
          ? 'border-primary bg-primary/10 z-20 shadow-lg' 
          : isMultiSelected
          ? 'border-blue-400 bg-blue-50 z-15 shadow-md'
          : isDragging || isResizing 
            ? 'z-20 shadow-lg border-cyan-300' 
            : 'border-cyan-300 hover:border-cyan-400 z-10'
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
      {/* Remove button - only show on hover */}
      <Button
        size="sm"
        variant="ghost"
        className="absolute -top-2 -right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30"
        onClick={onRemove}
        data-testid={`button-remove-${component.id}`}
      >
        <Trash2 className="w-3 h-3" />
      </Button>

      <div className="absolute inset-0 flex items-center justify-center px-3 pointer-events-none cursor-move" onMouseDown={handleMouseDown}>
        <div className="pointer-events-auto">
          {renderInput()}
        </div>
      </div>

      {/* Resize Handles - chỉ hiển thị cho các field có thể resize */}
      {RESIZABLE_FIELD_TYPES.includes(component.type) && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Corner handles */}
          <div
            className="absolute -top-1 -left-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-nw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
          />
          <div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-ne-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
          />
          <div
            className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-sw-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
          />
          <div
            className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-se-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
          />

          {/* Edge handles */}
          <div
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-n-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
          />
          <div
            className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-s-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 's')}
          />
          <div
            className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-w-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
          />
          <div
            className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-3 h-3 bg-white border-2 border-cyan-400 rounded-full cursor-e-resize"
            onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
          />
        </div>
      )}
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
  selectionBox
}: FormPreviewProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-preview',
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

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isAltPressed]);


  const handleMoveComponent = (id: string, x: number, y: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map(comp => 
      comp.id === id 
        ? { ...comp, position: { x, y } }
        : comp
    );
    onUpdateComponent(updatedComponents);
  };

  const handleResizeComponent = (id: string, width: number, height: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map(comp => 
      comp.id === id 
        ? { ...comp, size: { width, height } }
        : comp
    );
    onUpdateComponent(updatedComponents);
  };

  const handleResizeAndMoveComponent = (id: string, x: number, y: number, width: number, height: number) => {
    if (!onUpdateComponent) return;

    const updatedComponents = components.map(comp => 
      comp.id === id 
        ? { ...comp, position: { x, y }, size: { width, height } }
        : comp
    );
    onUpdateComponent(updatedComponents);
  };

  return (
    <Card className="h-full flex flex-col">
      <div className="flex-1 p-3">
        {imageFile ? (
          <div className="h-full min-h-[500px] relative">
            <ImageBackground file={imageFile}>
              <div
                ref={setNodeRef}
                className={`w-full h-full pointer-events-auto transition-colors ${
                  isOver ? 'bg-primary/5' : ''
                } ${
                  isAltPressed ? 'cursor-default' : 'cursor-default'
                }`}
                data-testid="form-preview-area"
                onMouseDown={(e) => {
                  onSelectionStart?.(e);
                }}
              >
                {components.length === 0 ? null : (
                  components.map((component) => (
                    <PreviewComponent
                      key={component.id}
                      component={component}
                      isAltPressed={isAltPressed}
                      onRemove={() => onRemoveComponent(component.id)}
                      onMove={handleMoveComponent}
                      onResize={handleResizeComponent}
                      onResizeAndMove={handleResizeAndMoveComponent}
                      onClick={onComponentClick}
                      isSelected={selectedComponentId === component.id}
                      isMultiSelected={selectedComponentIds.includes(component.id) && selectedComponentId !== component.id}
                      zoom={zoom}
                      fieldValues={fieldValues}
                      onFieldChange={(componentId, value) => 
                        setFieldValues(prev => ({ ...prev, [componentId]: value }))
                      }
                    />
                  ))
                )}

                {/* Selection Box */}
                {isSelecting && selectionBox && (
                  <div
                    style={{
                      position: 'absolute',
                      left: Math.min(selectionBox.startX, selectionBox.endX),
                      top: Math.min(selectionBox.startY, selectionBox.endY),
                      width: Math.abs(selectionBox.endX - selectionBox.startX),
                      height: Math.abs(selectionBox.endY - selectionBox.startY),
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid #3b82f6',
                      pointerEvents: 'none',
                      zIndex: 999
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
              isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'
            } ${
              isAltPressed ? 'cursor-default' : 'cursor-default'
            }`}
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
                    onClick={onComponentClick}
                    isSelected={selectedComponentId === component.id}
                    isMultiSelected={selectedComponentIds.includes(component.id) && selectedComponentId !== component.id}
                    zoom={zoom}
                    fieldValues={fieldValues}
                    onFieldChange={(componentId, value) => 
                      setFieldValues(prev => ({ ...prev, [componentId]: value }))
                    }
                  />
                ))}

                {/* Selection Box */}
                {isSelecting && selectionBox && (
                  <div
                    style={{
                      position: 'absolute',
                      left: Math.min(selectionBox.startX, selectionBox.endX),
                      top: Math.min(selectionBox.startY, selectionBox.endY),
                      width: Math.abs(selectionBox.endX - selectionBox.startX),
                      height: Math.abs(selectionBox.endY - selectionBox.startY),
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid #3b82f6',
                      pointerEvents: 'none',
                      zIndex: 999
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