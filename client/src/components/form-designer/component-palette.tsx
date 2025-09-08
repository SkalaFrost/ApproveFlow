import { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Type,
  List,
  CheckSquare,
  Calendar,
  Hash,
  FileText,
  ChevronRight,
  ChevronLeft,
  Table,
  BarChart3,
} from "lucide-react";
import type { FormComponent } from "@/types/form-designer";

const formComponents = [
  {
    type: "text" as const,
    label: "Text Input",
    icon: Type,
  },
  {
    type: "textarea" as const,
    label: "Text Area",
    icon: FileText,
  },
  {
    type: "select" as const,
    label: "Dropdown",
    icon: List,
  },
  {
    type: "checkbox" as const,
    label: "Checkbox",
    icon: CheckSquare,
  },
  {
    type: "date" as const,
    label: "Date Picker",
    icon: Calendar,
  },
  {
    type: "number" as const,
    label: "Number",
    icon: Hash,
  },
  {
    type: "table" as const,
    label: "Table",
    icon: Table,
  },
  {
    type: "chart" as const,
    label: "Chart",
    icon: BarChart3,
  },
];

interface DraggableComponentProps {
  type: FormComponent["type"];
  label: string;
  icon: React.ComponentType<any>;
  small?: boolean;
}

function DraggableComponent({
  type,
  label,
  icon: Icon,
  small = false,
}: DraggableComponentProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${type}`,
      data: {
        type: "component",
        componentType: type,
        label,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.7 : 1,
      }
    : undefined;

  if (small) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="drag-handle p-2 border border-border rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-grab flex items-center justify-center w-10 h-10"
            data-testid={`component-${type}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className="drag-handle p-3 border border-border rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-grab flex items-center justify-center w-full h-10"
          data-testid={`component-${type}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface DraggableComponentWrapperProps {
  type: FormComponent["type"];
  label: string;
  icon: React.ComponentType<any>;
  isExpanded: boolean;
}

function DraggableComponentWrapper({
  type,
  label,
  icon: Icon,
  isExpanded,
}: DraggableComponentWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `palette-${type}`,
      data: {
        type: "component",
        componentType: type,
        label,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.7 : 1,
      }
    : undefined;

  if (isExpanded) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="drag-handle p-2 border border-border rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-grab flex items-center space-x-2 min-w-[120px]"
            data-testid={`component-${type}-expanded`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium truncate">{label}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          ref={setNodeRef}
          style={style}
          {...listeners}
          {...attributes}
          className="drag-handle p-2 border border-border rounded-md bg-accent/30 hover:bg-accent/50 transition-colors cursor-grab flex items-center justify-center w-10 h-10"
          data-testid={`component-${type}`}
        >
          <Icon className="w-4 h-4" />
        </div>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface ComponentPaletteProps {
  onToggleCollapse?: (isCollapsed: boolean) => void;
}

export default function ComponentPalette({
  onToggleCollapse,
}: ComponentPaletteProps = {}) {
  const [isExpanded, setIsExpanded] = useState(true); // default expanded
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    setIsExpanded(!newCollapsed);
    if (onToggleCollapse) onToggleCollapse(newCollapsed);
  };

  if (isCollapsed) {
    return (
      <TooltipProvider>
        <div className="flex flex-col items-center gap-1 bg-background/95 backdrop-blur-sm px-2 py-3 rounded-full shadow-lg border">
          {formComponents.map((component) => (
            <DraggableComponent
              key={component.type}
              type={component.type}
              label={component.label}
              icon={component.icon}
              small
            />
          ))}
          <div className="w-px h-4 bg-border my-1"></div>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="h-8 w-8 p-0 flex items-center justify-center"
            data-testid="toggle-palette-collapse"
            aria-label="Expand palette"
            title="Expand"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center gap-1 bg-background/95 backdrop-blur-sm px-3 py-3 rounded-full shadow-lg border max-h-[80vh] overflow-y-auto">
        {formComponents.map((component) => (
          <DraggableComponentWrapper
            key={component.type}
            type={component.type}
            label={component.label}
            icon={component.icon}
            isExpanded={isExpanded}
          />
        ))}
        <div className="w-px h-4 bg-border my-1"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapse}
          className="h-8 w-8 p-0 flex items-center justify-center"
          data-testid="toggle-palette-collapse"
          aria-label="Collapse palette"
          title="Collapse"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </TooltipProvider>
  );
}
