import { useState, useRef, useEffect } from "react";
import { DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Settings, Trash2, Check, Clock, GitBranch, Mail, Webhook, Play, Edit2, X } from "lucide-react";
import { nanoid } from "nanoid";
import type { WorkflowStep } from "@/types/workflow";
import WorkflowStepPalette from "./workflow-step-palette";
import WorkflowCanvas from "./workflow-canvas";

interface WorkflowBuilderProps {
  workflowId?: string;
  onStepsChange?: (steps: WorkflowStep[]) => void;
  steps: WorkflowStep[];
}

export default function WorkflowBuilder({ 
  workflowId, 
  onStepsChange,
  steps: initialSteps
}: WorkflowBuilderProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(initialSteps || []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggedStep, setDraggedStep] = useState<any>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update steps when initialSteps changes
  useEffect(() => {
    setSteps(initialSteps || []);
  }, [initialSteps]);

  // Update parent with steps when they change
  const updateSteps = (newSteps: WorkflowStep[]) => {
    setSteps(newSteps);
    onStepsChange?.(newSteps);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setIsDragging(true);
    
    if (active.data.current?.type === 'step') {
      setDraggedStep({
        type: active.data.current.stepType,
        label: active.data.current.label
      });
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handle drag over events
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setIsDragging(false);
    setActiveId(null);
    setDraggedStep(null);

    if (!over || over.id !== 'workflow-canvas') return;

    // Add new step to the workflow
    if (active.data.current?.type === 'step') {
      const stepType = active.data.current.stepType;
      const dropPosition = active.data.current?.dropPosition || steps.length;
      
      const newStep: WorkflowStep = {
        id: nanoid(),
        name: getDefaultStepName(stepType),
        type: stepType,
        position: {
          x: 0,
          y: dropPosition * 120 + 100
        },
        connections: []
      };

      // Insert step at the drop position
      const newSteps = [...steps];
      newSteps.splice(dropPosition, 0, newStep);
      
      // Update positions for all steps
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        position: {
          x: 0,
          y: index * 120 + 100
        }
      }));

      updateSteps(updatedSteps);
    }
  };

  const getDefaultStepName = (type: WorkflowStep['type']): string => {
    switch (type) {
      case 'approval':
        return 'Approval Step';
      case 'notification':
        return 'Send Notification';
      case 'condition':
        return 'Conditional Branch';
      case 'action':
        return 'Action Step';
      default:
        return 'New Step';
    }
  };

  const handleStepClick = (stepId: string) => {
    setSelectedStepId(stepId);
  };

  const handleStepDelete = (stepId: string) => {
    const newSteps = steps.filter(step => step.id !== stepId);
    // Update positions after deletion
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      position: {
        x: 0,
        y: index * 120 + 100
      }
    }));
    updateSteps(updatedSteps);
    
    if (selectedStepId === stepId) {
      setSelectedStepId(null);
    }
  };

  const handleStepUpdate = (stepId: string, updates: Partial<WorkflowStep>) => {
    const newSteps = steps.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    );
    updateSteps(newSteps);
  };

  const addBranch = (parentStepId: string) => {
    const parentIndex = steps.findIndex(step => step.id === parentStepId);
    if (parentIndex === -1) return;

    const branchStep: WorkflowStep = {
      id: nanoid(),
      name: 'Branch Condition',
      type: 'condition',
      position: {
        x: 200,
        y: steps[parentIndex].position.y + 60
      },
      connections: []
    };

    // Update parent step connections
    const newSteps = [...steps];
    newSteps[parentIndex] = {
      ...newSteps[parentIndex],
      connections: [...newSteps[parentIndex].connections, branchStep.id]
    };
    
    newSteps.splice(parentIndex + 1, 0, branchStep);
    updateSteps(newSteps);
  };

  return (
    <div className="flex h-full bg-background">
      <DndContext
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Step Palette */}
        <div className="w-80 border-r bg-card">
          <WorkflowStepPalette />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative overflow-hidden">
            <WorkflowCanvas
              steps={steps}
              selectedStepId={selectedStepId}
              onStepClick={handleStepClick}
              onStepDelete={handleStepDelete}
              onStepUpdate={handleStepUpdate}
              onAddBranch={addBranch}
            />
          </div>
        </div>

        {/* Properties Panel */}
        {selectedStepId && (
          <div className="w-80 border-l bg-card">
            <WorkflowStepProperties
              step={steps.find(s => s.id === selectedStepId)!}
              onUpdate={(updates) => handleStepUpdate(selectedStepId, updates)}
              onClose={() => setSelectedStepId(null)}
            />
          </div>
        )}

        <DragOverlay>
          {draggedStep && (
            <div className="bg-card border rounded-lg p-3 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  {getStepIcon(draggedStep.type)}
                </div>
                <span className="text-sm font-medium">{draggedStep.label}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function getStepIcon(type: string) {
  switch (type) {
    case 'approval':
      return <Check className="w-4 h-4 text-primary-foreground" />;
    case 'notification':
      return <Mail className="w-4 h-4 text-primary-foreground" />;
    case 'condition':
      return <GitBranch className="w-4 h-4 text-primary-foreground" />;
    case 'action':
      return <Webhook className="w-4 h-4 text-primary-foreground" />;
    default:
      return <Play className="w-4 h-4 text-primary-foreground" />;
  }
}

// Placeholder component for step properties
function WorkflowStepProperties({ 
  step, 
  onUpdate, 
  onClose 
}: { 
  step: WorkflowStep; 
  onUpdate: (updates: Partial<WorkflowStep>) => void;
  onClose: () => void;
}) {
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Step Properties</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Step Name</label>
          <input
            type="text"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full mt-1 px-3 py-2 border rounded-md"
            data-testid="input-step-name"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Step Type</label>
          <Badge variant="outline" className="ml-2">
            {step.type}
          </Badge>
        </div>
        {step.type === 'approval' && (
          <div>
            <label className="text-sm font-medium">Assignee Role</label>
            <select
              value={step.assigneeRole || ''}
              onChange={(e) => onUpdate({ assigneeRole: e.target.value })}
              className="w-full mt-1 px-3 py-2 border rounded-md"
              data-testid="select-assignee-role"
            >
              <option value="">Select Role</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
              <option value="finance">Finance</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}