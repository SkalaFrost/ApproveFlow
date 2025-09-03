import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GitBranch, UserPlus } from "lucide-react";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      title: "Create New Form",
      description: "Design a custom form",
      icon: Plus,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => setLocation("/forms/designer"),
    },
    {
      title: "Build Workflow",
      description: "Create approval process",
      icon: GitBranch,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
      action: () => setLocation("/workflows"),
    },
    {
      title: "Invite Users",
      description: "Add team members",
      icon: UserPlus,
      color: "text-chart-4",
      bgColor: "bg-chart-4/10",
      action: () => setLocation("/users"),
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start h-auto p-3 hover:bg-accent/50"
              onClick={action.action}
              data-testid={`quick-action-${action.title.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <div className="flex items-center space-x-3 w-full">
                <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`${action.color} w-4 h-4`} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">{action.title}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
}
