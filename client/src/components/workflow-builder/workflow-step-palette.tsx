import { useDraggable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, GitBranch, Mail, Webhook, Play } from "lucide-react";

interface StepType {
  id: string;
  type: 'approval' | 'notification' | 'condition' | 'action';
  label: string;
  description: string;
  icon: any;
  color: string;
}

const stepTypes: StepType[] = [
  {
    id: 'approval',
    type: 'approval',
    label: 'Approval Step',
    description: 'Requires approval from assigned user or role',
    icon: Check,
    color: 'bg-green-500'
  },
  {
    id: 'notification',
    type: 'notification', 
    label: 'Send Notification',
    description: 'Send email or notification to users',
    icon: Mail,
    color: 'bg-blue-500'
  },
  {
    id: 'condition',
    type: 'condition',
    label: 'Conditional Branch',
    description: 'Branch workflow based on conditions',
    icon: GitBranch,
    color: 'bg-purple-500'
  },
  {
    id: 'action',
    type: 'action',
    label: 'Action Step', 
    description: 'Perform automated action or webhook',
    icon: Webhook,
    color: 'bg-orange-500'
  }
];

function DraggableStepItem({ stepType }: { stepType: StepType }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: stepType.id,
    data: {
      type: 'step',
      stepType: stepType.type,
      label: stepType.label
    }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const Icon = stepType.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        cursor-grab active:cursor-grabbing
        p-3 border rounded-lg hover:bg-accent transition-colors
        ${isDragging ? 'opacity-50' : ''}
      `}
      data-testid={`draggable-step-${stepType.type}`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${stepType.color} rounded-full flex items-center justify-center`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {stepType.label}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {stepType.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowStepPalette() {
  return (
    <Card className="h-full border-0 rounded-none">
      <CardHeader>
        <CardTitle className="text-lg">Workflow Steps</CardTitle>
        <p className="text-sm text-muted-foreground">
          Drag steps to build your workflow
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {stepTypes.map((stepType) => (
          <DraggableStepItem key={stepType.id} stepType={stepType} />
        ))}
        
        <div className="mt-6 p-3 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-2">Linear Flow</h4>
          <p className="text-xs text-muted-foreground">
            Steps flow from top to bottom. Use conditional branches to create alternate paths.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}