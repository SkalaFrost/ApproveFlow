import { useDroppable } from "@dnd-kit/core";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, GitBranch, Mail, Webhook, Play, Settings, Trash2, Plus, ArrowDown, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { WorkflowStep } from "@/types/workflow";

interface WorkflowCanvasProps {
  steps: WorkflowStep[];
  selectedStepId: string | null;
  onStepClick: (stepId: string) => void;
  onStepDelete: (stepId: string) => void;
  onStepUpdate: (stepId: string, updates: Partial<WorkflowStep>) => void;
  onAddBranch: (parentStepId: string) => void;
}

function getStepIcon(type: WorkflowStep['type']) {
  switch (type) {
    case 'approval':
      return <Check className="w-4 h-4" />;
    case 'notification':
      return <Mail className="w-4 h-4" />;
    case 'condition':
      return <GitBranch className="w-4 h-4" />;
    case 'action':
      return <Webhook className="w-4 h-4" />;
    default:
      return <Play className="w-4 h-4" />;
  }
}

function getStepColor(type: WorkflowStep['type']) {
  switch (type) {
    case 'approval':
      return 'bg-green-500';
    case 'notification':
      return 'bg-blue-500';
    case 'condition':
      return 'bg-purple-500';
    case 'action':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
}

function WorkflowStepCard({ 
  step, 
  isSelected, 
  onClick, 
  onDelete, 
  onAddBranch 
}: {
  step: WorkflowStep;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
  onAddBranch: () => void;
}) {
  return (
    <Card 
      className={`
        w-80 cursor-pointer transition-all hover:shadow-md
        ${isSelected ? 'ring-2 ring-primary border-primary' : ''}
      `}
      onClick={onClick}
      data-testid={`workflow-step-${step.id}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className={`w-10 h-10 ${getStepColor(step.type)} rounded-full flex items-center justify-center text-white`}>
              {getStepIcon(step.type)}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{step.name}</h4>
              <Badge variant="outline" className="text-xs mt-1">
                {step.type}
              </Badge>
              {step.assigneeRole && (
                <p className="text-xs text-muted-foreground mt-1">
                  Assigned to: {step.assigneeRole}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {step.type === 'condition' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddBranch();
                }}
                data-testid={`button-add-branch-${step.id}`}
              >
                <Plus className="w-3 h-3" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              data-testid={`button-delete-step-${step.id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function WorkflowCanvas({
  steps,
  selectedStepId,
  onStepClick,
  onStepDelete,
  onStepUpdate,
  onAddBranch
}: WorkflowCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'workflow-canvas'
  });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Group steps by their x position to handle main flow and branches
  const mainFlowSteps = steps.filter(step => step.position.x === 0);
  const branchSteps = steps.filter(step => step.position.x > 0);

  // Zoom controls
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom * 0.8, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prevZoom => Math.max(0.3, Math.min(3, prevZoom * delta)));
  };

  // Pan functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current || (e.target as HTMLElement).closest('[data-canvas-background]')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full bg-muted/20 overflow-hidden"
      data-testid="workflow-canvas"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          data-testid="button-zoom-in"
          className="w-10 h-10 p-0"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          data-testid="button-zoom-out"
          className="w-10 h-10 p-0"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetZoom}
          data-testid="button-reset-zoom"
          className="w-10 h-10 p-0"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>

      {/* Zoom Level Indicator */}
      <div className="absolute top-4 left-4 z-10 bg-background border rounded px-2 py-1 text-xs">
        {Math.round(zoom * 100)}%
      </div>

      {/* Canvas Content with Transform */}
      <div 
        ref={setNodeRef}
        className="w-full h-full"
        data-canvas-background="true"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
      {steps.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Build Your Workflow
            </h3>
            <p className="text-muted-foreground">
              Drag workflow steps from the left panel to get started
            </p>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          {/* Main Flow Column */}
          <div className="flex flex-col items-center space-y-6">
            {/* Start Node */}
            <div className="w-24 h-12 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-medium">
              Start
            </div>
            
            {mainFlowSteps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center">
                {/* Connector Line */}
                <div className="w-px h-6 bg-border"></div>
                
                {/* Step Card */}
                <WorkflowStepCard
                  step={step}
                  isSelected={selectedStepId === step.id}
                  onClick={() => onStepClick(step.id)}
                  onDelete={() => onStepDelete(step.id)}
                  onAddBranch={() => onAddBranch(step.id)}
                />
                
                {/* Branch Connections */}
                {step.connections.length > 0 && (
                  <div className="relative">
                    {step.connections.map((connectionId) => {
                      const branchStep = steps.find(s => s.id === connectionId);
                      if (!branchStep) return null;
                      
                      return (
                        <div 
                          key={connectionId}
                          className="absolute top-6 left-40 flex items-center"
                        >
                          {/* Branch Line */}
                          <div className="w-20 h-px bg-border"></div>
                          <ArrowDown className="w-4 h-4 text-muted-foreground rotate-45" />
                          
                          {/* Branch Step */}
                          <div className="ml-4">
                            <WorkflowStepCard
                              step={branchStep}
                              isSelected={selectedStepId === branchStep.id}
                              onClick={() => onStepClick(branchStep.id)}
                              onDelete={() => onStepDelete(branchStep.id)}
                              onAddBranch={() => onAddBranch(branchStep.id)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
            
            {/* End Node */}
            {mainFlowSteps.length > 0 && (
              <>
                <div className="w-px h-6 bg-border"></div>
                <div className="w-24 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                  End
                </div>
              </>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}