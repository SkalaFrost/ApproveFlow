import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, Hourglass, Flag } from "lucide-react";

const steps = [
  {
    id: "1",
    name: "Submit Request",
    status: "completed",
    icon: Check,
    iconColor: "text-white",
    iconBg: "bg-green-500",
  },
  {
    id: "2",
    name: "Manager Review", 
    status: "in_progress",
    icon: Clock,
    iconColor: "text-white",
    iconBg: "bg-yellow-500",
  },
  {
    id: "3",
    name: "Finance Approval",
    status: "pending",
    icon: Hourglass,
    iconColor: "text-gray-600",
    iconBg: "bg-gray-300",
  },
  {
    id: "4",
    name: "Final Approval",
    status: "pending",
    icon: Flag,
    iconColor: "text-gray-600", 
    iconBg: "bg-gray-300",
  },
];

const statusConfig = {
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  in_progress: { label: "In Progress", className: "bg-yellow-100 text-yellow-800" },
  pending: { label: "Pending", className: "bg-gray-100 text-gray-800" },
};

export default function WorkflowVisualization() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Workflow</CardTitle>
        <p className="text-sm text-muted-foreground">Purchase Order Approval Process</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const statusInfo = statusConfig[step.status as keyof typeof statusConfig];
            const isLast = index === steps.length - 1;
            
            return (
              <div 
                key={step.id}
                className={`workflow-step flex items-center space-x-3 ${!isLast ? 'relative' : ''}`}
                data-testid={`workflow-step-${step.id}`}
              >
                <div className={`w-8 h-8 ${step.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`${step.iconColor} w-4 h-4`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{step.name}</p>
                  <Badge className={statusInfo.className + " text-xs"}>
                    {statusInfo.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
