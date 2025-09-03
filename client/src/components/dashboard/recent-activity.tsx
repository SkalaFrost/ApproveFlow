import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Clock, FilePlus } from "lucide-react";

const activities = [
  {
    id: "1",
    title: "Purchase Order #PO-2024-001",
    description: "Approved by Sarah Johnson",
    timestamp: "2 hours ago",
    status: "approved",
    icon: Check,
    iconColor: "text-green-600",
    iconBg: "bg-green-100",
  },
  {
    id: "2", 
    title: "Expense Report #EXP-2024-089",
    description: "Submitted by Mike Chen",
    timestamp: "4 hours ago",
    status: "pending",
    icon: Clock,
    iconColor: "text-yellow-600",
    iconBg: "bg-yellow-100",
  },
  {
    id: "3",
    title: "New Workflow Created",
    description: "HR Onboarding Process v2.0",
    timestamp: "1 day ago",
    status: "created",
    icon: FilePlus,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
];

const statusConfig = {
  approved: { label: "Approved", className: "bg-green-100 text-green-800" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800" },
  created: { label: "Created", className: "bg-blue-100 text-blue-800" },
};

export default function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest document submissions and approvals</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon;
            const statusInfo = statusConfig[activity.status as keyof typeof statusConfig];
            
            return (
              <div 
                key={activity.id}
                className="flex items-start space-x-4 p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                data-testid={`activity-${activity.id}`}
              >
                <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center`}>
                  <Icon className={`${activity.iconColor} w-4 h-4`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.title}</p>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.timestamp}</p>
                </div>
                <Badge className={statusInfo.className}>
                  {statusInfo.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
