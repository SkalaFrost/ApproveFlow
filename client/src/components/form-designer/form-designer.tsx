import { useState, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import ComponentPalette from "./component-palette";
import FormPreview from "./form-preview";
import FormComponentProperties from "./form-component-properties";
import type { FormComponent } from "@/types/form-designer";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { PanelLeftOpen, PanelLeftClose } from "lucide-react";

interface FormDesignerProps {
  formId?: string;
  onSave?: () => void;
  onComponentsChange?: (components: any[]) => void;
  formName: string;
  formDescription: string;
  imageFile: File | null;
  selectedWorkflowId?: string;
  workflows?: Array<{ id: string; name: string; definition: any; }>;
}

/**
 * Chuyển clientX/clientY (viewport CSS px) -> tọa độ nội bộ của targetElement (layout px).
 */
function getDropPosition(
  clientX: number,
  clientY: number,
  targetElement: HTMLElement,
): { x: number; y: number } {
  const rect = targetElement.getBoundingClientRect();

  const relX = clientX - rect.left;
  const relY = clientY - rect.top;

  const hasLayoutSize =
    rect.width > 0 &&
    rect.height > 0 &&
    targetElement.offsetWidth > 0 &&
    targetElement.offsetHeight > 0;

  if (hasLayoutSize) {
    const scaleX = targetElement.offsetWidth / rect.width;
    const scaleY = targetElement.offsetHeight / rect.height;

    const internalX = relX * scaleX;
    const internalY = relY * scaleY;

    return {
      x: Math.max(0, internalX),
      y: Math.max(0, internalY),
    };
  }

  return { x: Math.max(0, relX), y: Math.max(0, relY) };
}

export default function FormDesigner({
  formId,
  onSave,
  onComponentsChange,
  formName,
  formDescription,
  imageFile,
  selectedWorkflowId,
  workflows = [],
}: FormDesignerProps) {
  const { toast } = useToast();
  const [components, setComponents] = useState<FormComponent[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedComponent, setDraggedComponent] = useState<any>(null);
  const [propertiesPanelWidth, setPropertiesPanelWidth] = useState(320); // Default w-80 is 320px
  const [currentMousePosition, setCurrentMousePosition] = useState({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isComponentPaletteCollapsed, setIsComponentPaletteCollapsed] =
    useState(false);
  const [isProcessingDrop, setIsProcessingDrop] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(
    null,
  );
  const [selectedComponentIds, setSelectedComponentIds] = useState<string[]>([]);
  const [copiedComponents, setCopiedComponents] = useState<FormComponent[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  const [dragPointerOffset, setDragPointerOffset] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const updateComponents = (newComponents: FormComponent[]) => {
    console.log('updateComponents called with:', newComponents);
    console.log('Length of new components:', newComponents.length);
    setComponents(newComponents);
    onComponentsChange?.(newComponents);
    console.log('onComponentsChange called with:', newComponents);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setCurrentMousePosition({ x: e.clientX, y: e.clientY });
      }
      if (isSelecting && selectionBox) {
        const formPreviewArea = document.querySelector('[data-testid="form-preview-area"]') as HTMLElement;
        if (formPreviewArea) {
          const rect = formPreviewArea.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          setSelectionBox(prev => prev ? { ...prev, endX: x, endY: y } : null);
        }
      }
    };

    const handleMouseUp = () => {
      if (isSelecting && selectionBox) {
        handleSelectionEnd();
      }
    };

    if (isDragging || isSelecting) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
    return;
  }, [isDragging, isSelecting, selectionBox]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when focus is on the form designer area
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      if (e.key === 'Delete') {
        e.preventDefault();
        if (selectedComponentIds.length > 0) {
          handleRemoveMultipleComponents(selectedComponentIds);
        } else if (selectedComponentId) {
          handleRemoveComponent(selectedComponentId);
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          if (selectedComponentIds.length > 0) {
            handleCopyMultipleComponents(selectedComponentIds);
          } else if (selectedComponentId) {
            handleCopyComponent(selectedComponentId);
          }
        }
        
        if (e.key === 'v') {
          e.preventDefault();
          if (copiedComponents.length > 0) {
            handlePasteMultipleComponents();
          }
        }

        if (e.key === 'a') {
          e.preventDefault();
          handleSelectAll();
        }
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setSelectedComponentIds([]);
        setSelectedComponentId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, selectedComponentIds, copiedComponents]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    console.log('handleDragStart called with:', active.id, active.data.current);
    setActiveId(active.id as string);
    setIsDragging(true);

    // Drag từ palette
    if (active.data.current?.type === "component") {
      setDraggedComponent({
        type: active.data.current.componentType,
        label: active.data.current.label,
        origin: "palette",
      });

      const defaultPreviewWidth = 200;
      const defaultPreviewHeight = 40;
      setDragPointerOffset({
        x: Math.round(defaultPreviewWidth / 2),
        y: Math.round(defaultPreviewHeight / 2),
      });
      return;
    }

    // Re-drag từ form
    if (
      active.data.current?.type === "placed" ||
      active.data.current?.type === "instance"
    ) {
      setDraggedComponent({
        id: active.id,
        type: active.data.current.componentType ?? "placed",
        label: active.data.current.label ?? "Field",
        origin: "placed",
      });

      // Tìm element thật trên DOM
      const element = document.querySelector(
        `[data-id="${active.id}"]`,
      ) as HTMLElement | null;

      if (element && "clientX" in event.activatorEvent) {
        const rect = element.getBoundingClientRect();
        const offsetX =
          (event.activatorEvent as MouseEvent).clientX - rect.left;
        const offsetY = (event.activatorEvent as MouseEvent).clientY - rect.top;
        const internalOffsetX = offsetX / zoom;
        const internalOffsetY = offsetY / zoom;
        setDragPointerOffset({ x: internalOffsetX, y: internalOffsetY });
      } else {
        setDragPointerOffset(null);
      }
      return;
    }

    setDraggedComponent(null);
    setDragPointerOffset(null);
  };

  const handleDragOver = (event: DragOverEvent) => {};

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);

    console.log('handleDragEnd called:', { 
      activeId, 
      activeDataType: active.data.current?.type,
      overId: over?.id,
      isProcessingDrop
    });

    if (!activeId || activeId !== active.id || isProcessingDrop) {
      console.log('Early return from handleDragEnd');
      return;
    }

    setIsProcessingDrop(true);

    if (!over) {
      console.log('No drop target found');
      setActiveId(null);
      setDraggedComponent(null);
      setCurrentMousePosition({ x: 0, y: 0 });
      setDragPointerOffset(null);
      setIsProcessingDrop(false);
      return;
    }

    const droppableElement = document.querySelector(
      '[data-testid="form-preview-area"]',
    ) as HTMLElement | null;

    if (!droppableElement) {
      setActiveId(null);
      setDraggedComponent(null);
      setDragPointerOffset(null);
      setIsProcessingDrop(false);
      return;
    }

    const dropCoords = getDropPosition(
      currentMousePosition.x,
      currentMousePosition.y,
      droppableElement,
    );

    // Thả component mới từ palette
    if (
      active.data.current?.type === "component" &&
      over.id === "form-preview"
    ) {
      console.log('Creating new component from palette');
      const compWidth = 200;
      const compHeight = 40;

      const offset = dragPointerOffset ?? {
        x: Math.round(compWidth / 2),
        y: Math.round(compHeight / 2),
      };

      const x = Math.max(0, Math.round(dropCoords.x - offset.x));
      const y = Math.max(0, Math.round(dropCoords.y - offset.y));

      const newComponent: FormComponent = {
        id: nanoid(),
        type: active.data.current.componentType,
        label: active.data.current.label,
        placeholder: "",
        required: false,
        position: { x, y },
        size: { width: compWidth, height: compHeight },
      };

      console.log('New component created:', newComponent);
      console.log('Current components before update:', components);
      updateComponents([...components, newComponent]);
    }

    // Reposition component đã có
    if (
      (active.data.current?.type === "placed" ||
        active.data.current?.type === "instance") &&
      over.id === "form-preview"
    ) {
      const compId = active.id as string;
      const offset = dragPointerOffset ?? { x: 0, y: 0 };

      const x = Math.max(0, Math.round(dropCoords.x - offset.x));
      const y = Math.max(0, Math.round(dropCoords.y - offset.y));

      const newComponents = components.map((comp) =>
        comp.id === compId ? { ...comp, position: { x, y } } : comp,
      );
      updateComponents(newComponents);
    }

    setActiveId(null);
    setDraggedComponent(null);
    setCurrentMousePosition({ x: 0, y: 0 });
    setDragPointerOffset(null);
    setIsProcessingDrop(false);
  };

  const handleRemoveComponent = (id: string) => {
    const componentToRemove = components.find((comp) => comp.id === id);
    const newComponents = components.filter((comp) => comp.id !== id);
    updateComponents(newComponents);
    if (selectedComponentId === id) {
      setSelectedComponentId(null);
    }
    
    if (componentToRemove) {
      toast({
        title: "Component Deleted",
        description: `${componentToRemove.label} has been deleted.`,
        duration: 2000,
      });
    }
  };

  const adjustPropertiesPanelWidth = (increment: number) => {
    const newWidth = Math.max(240, Math.min(600, propertiesPanelWidth + increment));
    setPropertiesPanelWidth(newWidth);
  };

  const handleComponentClick = (id: string, event?: React.MouseEvent) => {
    if (event?.ctrlKey || event?.metaKey) {
      // Multi-select mode
      if (selectedComponentIds.includes(id)) {
        setSelectedComponentIds(prev => prev.filter(componentId => componentId !== id));
        if (selectedComponentId === id) {
          setSelectedComponentId(null);
        }
      } else {
        setSelectedComponentIds(prev => [...prev, id]);
        setSelectedComponentId(id);
      }
    } else if (event?.shiftKey && selectedComponentId) {
      // Range select - select from last selected to current
      const currentIndex = components.findIndex(c => c.id === id);
      const lastIndex = components.findIndex(c => c.id === selectedComponentId);
      if (currentIndex !== -1 && lastIndex !== -1) {
        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = components.slice(start, end + 1).map(c => c.id);
        setSelectedComponentIds(rangeIds);
      }
    } else {
      // Single select
      setSelectedComponentId(id);
      setSelectedComponentIds([]);
    }
  };

  const handleComponentUpdate = (
    id: string,
    updates: Partial<FormComponent>,
  ) => {
    const newComponents = components.map((comp) =>
      comp.id === id ? { ...comp, ...updates } : comp,
    );
    updateComponents(newComponents);
  };

  const handleRemoveMultipleComponents = (ids: string[]) => {
    const componentsToRemove = components.filter(comp => ids.includes(comp.id));
    const newComponents = components.filter((comp) => !ids.includes(comp.id));
    updateComponents(newComponents);
    setSelectedComponentIds([]);
    setSelectedComponentId(null);
    
    toast({
      title: "Components Deleted",
      description: `${componentsToRemove.length} component(s) have been deleted.`,
      duration: 2000,
    });
  };

  const handleSelectAll = () => {
    const allIds = components.map(comp => comp.id);
    setSelectedComponentIds(allIds);
    setSelectedComponentId(allIds[0] || null);
    
    toast({
      title: "All Components Selected",
      description: `${allIds.length} component(s) selected.`,
      duration: 1500,
    });
  };

  const handleCopyComponent = (id: string) => {
    const componentToCopy = components.find((comp) => comp.id === id);
    if (componentToCopy) {
      setCopiedComponents([componentToCopy]);
      console.log('Component copied:', componentToCopy);
      toast({
        title: "Component Copied",
        description: `${componentToCopy.label} copied to clipboard. Press Ctrl+V to paste.`,
        duration: 2000,
      });
    }
  };

  const handleCopyMultipleComponents = (ids: string[]) => {
    const componentsToCopy = components.filter(comp => ids.includes(comp.id));
    if (componentsToCopy.length > 0) {
      setCopiedComponents(componentsToCopy);
      console.log('Components copied:', componentsToCopy);
      toast({
        title: "Components Copied",
        description: `${componentsToCopy.length} component(s) copied to clipboard. Press Ctrl+V to paste.`,
        duration: 2000,
      });
    }
  };

  const handlePasteMultipleComponents = () => {
    if (copiedComponents.length === 0) return;
    
    const maxX = 800;
    const maxY = 600;
    const newComponents: FormComponent[] = [];
    const pastedIds: string[] = [];
    
    copiedComponents.forEach((copiedComponent, index) => {
      // Calculate paste position with staggered offset for multiple components
      let pasteX = copiedComponent.position.x + 20 + (index * 10);
      let pasteY = copiedComponent.position.y + 20 + (index * 10);
      
      // Boundary checks
      if (pasteX + copiedComponent.size.width > maxX) {
        pasteX = Math.max(0, maxX - copiedComponent.size.width);
      }
      
      if (pasteY + copiedComponent.size.height > maxY) {
        pasteY = Math.max(0, maxY - copiedComponent.size.height);
      }
      
      // Check for position conflicts
      const isPositionOccupied = (x: number, y: number) => {
        return [...components, ...newComponents].some(comp => 
          Math.abs(comp.position.x - x) < 10 && 
          Math.abs(comp.position.y - y) < 10
        );
      };
      
      let offset = 0;
      while (isPositionOccupied(pasteX, pasteY) && offset < 200) {
        offset += 20;
        pasteX = copiedComponent.position.x + offset + (index * 10);
        pasteY = copiedComponent.position.y + offset + (index * 10);
        
        if (pasteX > maxX - copiedComponent.size.width) {
          pasteX = 20 + (index * 10);
          pasteY += 20;
        }
      }
      
      const newComponent: FormComponent = {
        ...copiedComponent,
        id: nanoid(),
        position: { x: pasteX, y: pasteY },
      };
      
      newComponents.push(newComponent);
      pastedIds.push(newComponent.id);
    });

    console.log('Pasting components:', newComponents);
    updateComponents([...components, ...newComponents]);
    
    // Select the newly pasted components
    setSelectedComponentIds(pastedIds);
    setSelectedComponentId(pastedIds[0] || null);
    
    toast({
      title: "Components Pasted",
      description: `${newComponents.length} component(s) pasted successfully.`,
      duration: 2000,
    });
  };

  const handleSelectionStart = (e: React.MouseEvent) => {
    const formPreviewArea = e.currentTarget as HTMLElement;
    const rect = formPreviewArea.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Only start selection if not clicking on a component
    const target = e.target as HTMLElement;
    if (!target.closest('[data-component-id]')) {
      setIsSelecting(true);
      setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      setSelectedComponentIds([]);
      setSelectedComponentId(null);
    }
  };

  const handleSelectionEnd = () => {
    if (!selectionBox) return;
    
    const { startX, startY, endX, endY } = selectionBox;
    const minX = Math.min(startX, endX);
    const maxX = Math.max(startX, endX);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);
    
    // Find components within selection box
    const selectedIds = components.filter(component => {
      const compX = component.position.x;
      const compY = component.position.y;
      const compWidth = component.size.width;
      const compHeight = component.size.height;
      
      return compX >= minX && compY >= minY && 
             compX + compWidth <= maxX && compY + compHeight <= maxY;
    }).map(comp => comp.id);
    
    if (selectedIds.length > 0) {
      setSelectedComponentIds(selectedIds);
      setSelectedComponentId(selectedIds[0]);
    }
    
    setIsSelecting(false);
    setSelectionBox(null);
  };

  const handleSave = () => {
    onSave?.();
  };

  let overlayWidth = 200;
  let overlayHeight = 40;
  if (draggedComponent?.origin === "placed") {
    const comp = components.find((c) => c.id === draggedComponent.id);
    if (comp) {
      overlayWidth = comp.size?.width ?? overlayWidth;
      overlayHeight = comp.size?.height ?? overlayHeight;
    }
  }

  return (
    <div className="h-full flex flex-col">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* Palette */}
          <div
            className={`flex-shrink-0 transition-all duration-300 ${
              isComponentPaletteCollapsed ? "w-12 mr-2" : "w-36 mr-2"
            }`}
          >
            <ComponentPalette
              onToggleCollapse={setIsComponentPaletteCollapsed}
            />
          </div>

          {/* Form Preview */}
          <div className="flex-1">
            <FormPreview
              components={components}
              onRemoveComponent={handleRemoveComponent}
              onComponentClick={handleComponentClick}
              selectedComponentId={selectedComponentId}
              selectedComponentIds={selectedComponentIds}
              imageFile={imageFile}
              onUpdateComponent={(updatedComponents) => {
                setComponents(updatedComponents);
                onComponentsChange?.(updatedComponents);
              }}
              zoom={zoom}
              onSelectionStart={handleSelectionStart}
              isSelecting={isSelecting}
              selectionBox={selectionBox}
            />
          </div>

          {/* Properties Panel */}
          {selectedComponentId &&
            (() => {
              const selectedComponent = components.find(
                (c) => c.id === selectedComponentId,
              );
              return selectedComponent ? (
                <div 
                  className="border-l bg-card ml-2 relative"
                  style={{ width: `${propertiesPanelWidth}px` }}
                >
                  {/* Width adjustment controls */}
                  <div className="absolute -left-2 top-4 z-10 flex flex-col space-y-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustPropertiesPanelWidth(40)}
                      className="h-6 w-6 p-0 bg-background"
                      title="Increase panel width"
                      data-testid="button-expand-properties"
                    >
                      <PanelLeftOpen className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustPropertiesPanelWidth(-40)}
                      className="h-6 w-6 p-0 bg-background"
                      title="Decrease panel width"
                      data-testid="button-shrink-properties"
                    >
                      <PanelLeftClose className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <FormComponentProperties
                    component={selectedComponent}
                    allComponents={components}
                    selectedWorkflowId={selectedWorkflowId}
                    workflows={workflows}
                    onUpdate={(updates) =>
                      handleComponentUpdate(selectedComponentId, updates)
                    }
                    onClose={() => setSelectedComponentId(null)}
                  />
                </div>
              ) : null;
            })()}
        </div>

        {/* DragOverlay */}
        <DragOverlay dropAnimation={null}>
          {activeId && draggedComponent ? (
            <div
              style={{
                width: overlayWidth,
                height: overlayHeight,
                cursor: "grabbing",
                contain: "layout size style",
                willChange: "transform",
              }}
              className="bg-cyan-50 border-2 border-dashed border-cyan-300 rounded p-2 flex items-center justify-start select-none overflow-hidden"
            >
              <span className="text-sm text-gray-700 font-medium pointer-events-none truncate">
                {draggedComponent.label}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
