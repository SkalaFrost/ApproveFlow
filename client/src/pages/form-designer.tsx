import { useState, useRef } from "react";
import { useParams } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import FormDesigner from "@/components/form-designer/form-designer";
import FormPreviewModal from "@/components/form-designer/form-preview-modal";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { FormSchema } from "@/types/form-designer";

export default function FormDesignerPage() {
  const { id } = useParams<{ id?: string }>();
  const { toast } = useToast();
  
  // Form settings state moved to page level
  const [formName, setFormName] = useState("Untitled Form");
  const [formDescription, setFormDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("");
  const [currentComponents, setCurrentComponents] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch workflows for selection
  const { data: workflows = [] } = useQuery({
    queryKey: ["/api/workflows"],
    queryFn: () => fetch("/api/workflows").then(res => res.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (components: any[]) => {
      const formData = {
        name: formName,
        description: formDescription,
        definition: components,
        workflowId: selectedWorkflowId || null,
        createdBy: "current-user-id", // TODO: Replace with actual user ID
        isActive: true,
      };

      if (id) {
        return apiRequest("PATCH", `/api/forms/${id}`, formData);
      } else {
        return apiRequest("POST", "/api/forms", formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: id ? "Form updated successfully" : "Form created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate(currentComponents);
  };

  const handleComponentsUpdate = (components: any[]) => {
    console.log('handleComponentsUpdate called with:', components);
    console.log('Components count:', components.length);
    setCurrentComponents(components);
  };

  const handleImageUpload = (file: File) => {
    setImageFile(file);
  };

  const handleImageRemove = () => {
    setImageFile(null);
  };

  const handlePreview = () => {
    console.log('=== PREVIEW BUTTON CLICKED ===');
    console.log('Current components for preview:', currentComponents);
    console.log('Components count:', currentComponents.length);
    console.log('Form name:', formName);
    console.log('Image file:', imageFile);
    console.log('=== END PREVIEW DEBUG ===');
    setShowPreview(true);
  };

  // Test function để thêm component thủ công
  const addTestComponent = () => {
    const testComponent = {
      id: 'test-123',
      type: 'text',
      label: 'Test Input',
      placeholder: 'Test placeholder',
      required: false,
      position: { x: 50, y: 50 },
      size: { width: 200, height: 40 }
    };
    console.log('Adding test component:', testComponent);
    setCurrentComponents([testComponent]);
  };

  return (
    <>
      <Header 
        title={id ? "Edit Form" : "Form Designer"}
        showCreateButton={false}
        showFormFields={true}
        formName={formName}
        formDescription={formDescription}
        imageFile={imageFile}
        selectedWorkflowId={selectedWorkflowId}
        workflows={workflows}
        onFormNameChange={setFormName}
        onFormDescriptionChange={setFormDescription}
        onWorkflowChange={setSelectedWorkflowId}
        onImageUpload={handleImageUpload}
        onImageRemove={handleImageRemove}
        onSave={handleSave}
        onPreview={handlePreview}
      />
      
      <main className="flex-1 p-2 bg-background min-h-0 overflow-hidden">
        <div className="h-full overflow-hidden">
          <FormDesigner 
            formId={id}
            onSave={handleSave}
            onComponentsChange={handleComponentsUpdate}
            formName={formName}
            formDescription={formDescription}
            imageFile={imageFile}
            selectedWorkflowId={selectedWorkflowId}
            workflows={workflows}
          />
        </div>
      </main>

      <FormPreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        components={currentComponents}
        formName={formName}
        formDescription={formDescription}
        imageFile={imageFile}
      />
    </>
  );
}
