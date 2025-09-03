import { useState } from "react";
import { useParams } from "wouter";
import { useMutation } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import WorkflowBuilder from "@/components/workflow-builder/workflow-builder";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { WorkflowStep } from "@/types/workflow";

export default function WorkflowDesignerPage() {
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  
  // Workflow settings state
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [currentSteps, setCurrentSteps] = useState<WorkflowStep[]>([]);

  const saveMutation = useMutation({
    mutationFn: (steps: WorkflowStep[]) => {
      const workflowData = {
        name: workflowName,
        description: workflowDescription,
        steps: steps,
        isActive: true,
        createdBy: "current-user-id", // TODO: Replace with actual user ID
      };

      if (id) {
        return apiRequest("PATCH", `/api/workflows/${id}`, workflowData);
      } else {
        return apiRequest("POST", "/api/workflows", workflowData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workflows"] });
      toast({
        title: "Success",
        description: id ? "Workflow updated successfully" : "Workflow created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save workflow. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(currentSteps);
  };

  const handleStepsUpdate = (steps: WorkflowStep[]) => {
    setCurrentSteps(steps);
  };

  const handlePreview = () => {
    toast({
      title: "Preview",
      description: "Workflow preview functionality coming soon!",
    });
  };

  const handleClearAll = () => {
    setCurrentSteps([]);
  };

  return (
    <>
      <Header 
        title={id ? "Edit Workflow" : "Workflow Designer"}
        showCreateButton={false}
        showWorkflowFields={true}
        workflowName={workflowName}
        workflowDescription={workflowDescription}
        onWorkflowNameChange={setWorkflowName}
        onWorkflowDescriptionChange={setWorkflowDescription}
        onSave={handleSave}
        onClearAll={handleClearAll}
      />
      
      <main className="flex-1 overflow-hidden bg-background">
        <WorkflowBuilder
          workflowId={id}
          onStepsChange={handleStepsUpdate}
          steps={currentSteps}
        />
      </main>
    </>
  );
}