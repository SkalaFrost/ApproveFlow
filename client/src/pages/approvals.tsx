import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Approval } from "@shared/schema";
import { useState } from "react";

export default function Approvals() {
  const [selectedApproval, setSelectedApproval] = useState<string | null>(null);
  const [comments, setComments] = useState("");
  const { toast } = useToast();

  const { data: approvals, isLoading } = useQuery<Approval[]>({
    queryKey: ["/api/approvals/pending", "current-user-id"], // TODO: Replace with actual user ID
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status, comments }: { id: string; status: string; comments?: string }) => 
      apiRequest("PATCH", `/api/approvals/${id}`, { 
        status, 
        comments,
        decidedAt: new Date().toISOString()
      }),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/approvals"] });
      toast({
        title: "Success",
        description: `Request ${status} successfully`,
      });
      setSelectedApproval(null);
      setComments("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to process approval. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    approveMutation.mutate({ id, status: "approved", comments });
  };

  const handleReject = (id: string) => {
    if (!comments.trim()) {
      toast({
        title: "Comments Required",
        description: "Please provide comments when rejecting a request.",
        variant: "destructive",
      });
      return;
    }
    approveMutation.mutate({ id, status: "rejected", comments });
  };

  const handleViewDetails = (id: string) => {
    // TODO: Navigate to document details
    console.log("View approval details:", id);
  };

  if (isLoading) {
    return (
      <>
        <Header 
          title="Pending Approvals"
          showCreateButton={false}
        />
        <main className="flex-1 p-6 overflow-auto bg-background">
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </>
    );
  }

  // Mock data for demonstration since we don't have real approvals yet
  const mockApprovals = [
    {
      id: "1",
      documentId: "doc-1",
      workflowStepId: "step-1",
      approverId: "current-user-id",
      status: "pending",
      title: "Purchase Order #PO-2024-001",
      submitter: "John Smith",
      submittedAt: new Date().toISOString(),
      amount: "$2,500",
      department: "Engineering",
    },
    {
      id: "2",
      documentId: "doc-2", 
      workflowStepId: "step-2",
      approverId: "current-user-id",
      status: "pending",
      title: "Travel Request - Conference 2024",
      submitter: "Sarah Johnson",
      submittedAt: new Date().toISOString(),
      amount: "$1,200",
      department: "Marketing",
    },
  ];

  return (
    <>
      <Header 
        title="Pending Approvals"
        showCreateButton={false}
      />
      
      <main className="flex-1 p-6 overflow-auto bg-background">
        {mockApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96">
            <div className="text-center">
              <h3 className="text-lg font-medium text-foreground mb-2">No pending approvals</h3>
              <p className="text-muted-foreground">
                You're all caught up! No requests require your approval at this time.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mockApprovals.map((approval) => (
              <Card key={approval.id} className="hover-lift transition-all" data-testid={`approval-card-${approval.id}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-medium text-foreground">{approval.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                        <span>Submitted by: {approval.submitter}</span>
                        <span>Amount: {approval.amount}</span>
                        <span>Department: {approval.department}</span>
                        <span>Date: {new Date(approval.submittedAt).toLocaleDateString()}</span>
                      </div>
                      
                      <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                        Pending Review
                      </Badge>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(approval.id)}
                        data-testid={`button-view-${approval.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                  
                  {selectedApproval === approval.id && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="comments">Comments (Optional for approval, required for rejection)</Label>
                          <Textarea
                            id="comments"
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Add your comments here..."
                            className="mt-1"
                            data-testid="textarea-comments"
                          />
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleApprove(approval.id)}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`button-confirm-approve-${approval.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleReject(approval.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-confirm-reject-${approval.id}`}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedApproval(null);
                              setComments("");
                            }}
                            data-testid={`button-cancel-${approval.id}`}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedApproval !== approval.id && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => setSelectedApproval(approval.id)}
                        className="bg-green-600 hover:bg-green-700"
                        data-testid={`button-approve-${approval.id}`}
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => setSelectedApproval(approval.id)}
                        data-testid={`button-reject-${approval.id}`}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
