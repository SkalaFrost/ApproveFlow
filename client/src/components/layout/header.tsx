import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Bell, Plus, Upload, X } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
  // Form designer specific props
  showFormFields?: boolean;
  formName?: string;
  formDescription?: string;
  imageFile?: File | null;
  onFormNameChange?: (value: string) => void;
  onFormDescriptionChange?: (value: string) => void;
  onImageUpload?: (file: File) => void;
  onImageRemove?: () => void;
  onSave?: () => void;
  onPreview?: () => void;
  // Workflow designer specific props
  showWorkflowFields?: boolean;
  workflowName?: string;
  workflowDescription?: string;
  onWorkflowNameChange?: (value: string) => void;
  onWorkflowDescriptionChange?: (value: string) => void;
  onClearAll?: () => void;
}

export default function Header({ 
  title, 
  subtitle, 
  showCreateButton = true, 
  onCreateClick,
  showFormFields = false,
  formName = "",
  formDescription = "",
  imageFile = null,
  onFormNameChange,
  onFormDescriptionChange,
  onImageUpload,
  onImageRemove,
  onSave,
  onPreview,
  showWorkflowFields = false,
  workflowName = "",
  workflowDescription = "",
  onWorkflowNameChange,
  onWorkflowDescriptionChange,
  onClearAll
}: HeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload?.(file);
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3 shadow-sm">
      {showFormFields ? (
        <div className="flex items-center justify-between gap-6">
          {/* Left side - Title and Form Fields */}
          <div className="flex items-center gap-6 flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            
            {/* Form Fields */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-44">
                <Label htmlFor="header-form-name" className="text-xs mb-1 block">Form Name</Label>
                <Input
                  id="header-form-name"
                  value={formName}
                  onChange={(e) => onFormNameChange?.(e.target.value)}
                  placeholder="Enter form name"
                  className="h-7 text-xs"
                  data-testid="input-form-name"
                />
              </div>
              
              <div className="w-44">
                <Label htmlFor="header-form-description" className="text-xs mb-1 block">Description</Label>
                <Input
                  id="header-form-description"
                  value={formDescription}
                  onChange={(e) => onFormDescriptionChange?.(e.target.value)}
                  placeholder="Enter description"
                  className="h-7 text-xs"
                  data-testid="input-form-description"
                />
              </div>
              
              <div className="w-28">
                <Label className="text-xs mb-1 block">Image</Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-xs px-2"
                    data-testid="button-upload-image"
                  >
                    <Upload className="w-3 h-3 mr-1" />
                    {imageFile ? 'Change' : 'Upload'}
                  </Button>
                  {imageFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={onImageRemove}
                      className="h-7 w-7 p-0"
                      data-testid="button-remove-image"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  data-testid="input-image-upload"
                />
                {imageFile && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {imageFile.name}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs px-3" 
              onClick={onPreview}
              data-testid="button-preview"
            >
              Preview
            </Button>
            <Button 
              onClick={onSave} 
              size="sm" 
              className="h-7 text-xs px-3" 
              data-testid="button-save-form"
            >
              Save Form
            </Button>
          </div>
        </div>
      ) : showWorkflowFields ? (
        <div className="flex items-center justify-between gap-6">
          {/* Left side - Title and Workflow Fields */}
          <div className="flex items-center gap-6 flex-1">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-foreground">{title}</h1>
              {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            
            {/* Workflow Fields */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-44">
                <Label htmlFor="header-workflow-name" className="text-xs mb-1 block">Workflow Name</Label>
                <Input
                  id="header-workflow-name"
                  value={workflowName}
                  onChange={(e) => onWorkflowNameChange?.(e.target.value)}
                  placeholder="Enter workflow name"
                  className="h-7 text-xs"
                  data-testid="input-workflow-name"
                />
              </div>
              
              <div className="w-44">
                <Label htmlFor="header-workflow-description" className="text-xs mb-1 block">Description</Label>
                <Input
                  id="header-workflow-description"
                  value={workflowDescription}
                  onChange={(e) => onWorkflowDescriptionChange?.(e.target.value)}
                  placeholder="Enter description"
                  className="h-7 text-xs"
                  data-testid="input-workflow-description"
                />
              </div>
            </div>
          </div>
          
          {/* Right side - Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 text-xs px-3" 
              onClick={onClearAll}
              data-testid="button-clear-workflow"
            >
              Clear All
            </Button>
            <Button 
              onClick={onSave} 
              size="sm" 
              className="h-7 text-xs px-3" 
              data-testid="button-save-workflow"
            >
              Save Workflow
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input
                type="search"
                placeholder="Search documents..."
                className="pl-10 pr-4 py-2 w-64"
                data-testid="input-search"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
            
            <button 
              className="relative p-2 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full" />
            </button>
            
            {showCreateButton && (
              <Button onClick={onCreateClick} data-testid="button-create-new">
                <Plus className="w-4 h-4 mr-2" />
                Create New
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
