import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X } from "lucide-react";
import type { Approval } from "@shared/schema";

export default function PendingApprovals() {
  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ["/api/approvals/pending", "current-user-id"], // TODO: Replace with actual user ID
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Your Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="flex space-x-2">
                  <Skeleton className="w-6 h-6 rounded" />
                  <Skeleton className="w-6 h-6 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mock data for demonstration since we don't have real approvals yet
  const mockApprovals = [
    {
      id: "1",
      title: "Travel Request",
      submitter: "Alice Cooper",
    },
    {
      id: "2", 
      title: "Budget Allocation",
      submitter: "Finance Team",
    },
  ];

  const handleApprove = (id: string) => {
    console.log("Approve:", id);
    // TODO: Implement approval logic
  };

  const handleReject = (id: string) => {
    console.log("Reject:", id);
    // TODO: Implement rejection logic
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Your Approval</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockApprovals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No pending approvals
            </p>
          ) : (
            mockApprovals.map((approval) => (
              <div 
                key={approval.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
                data-testid={`approval-${approval.id}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{approval.title}</p>
                  <p className="text-xs text-muted-foreground">by {approval.submitter}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0 bg-green-100 hover:bg-green-200 border-green-200"
                    onClick={() => handleApprove(approval.id)}
                    data-testid={`button-approve-${approval.id}`}
                  >
                    <Check className="w-3 h-3 text-green-600" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-6 h-6 p-0 bg-red-100 hover:bg-red-200 border-red-200"
                    onClick={() => handleReject(approval.id)}
                    data-testid={`button-reject-${approval.id}`}
                  >
                    <X className="w-3 h-3 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
