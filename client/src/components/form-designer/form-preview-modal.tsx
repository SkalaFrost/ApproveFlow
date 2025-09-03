import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import ImageBackground from './image-background';
import type { FormComponent } from '@/types/form-designer';

interface FormPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  components: FormComponent[];
  formName: string;
  formDescription?: string;
  imageFile?: File | null;
}

export default function FormPreviewModal({
  open,
  onOpenChange,
  components,
  formName,
  formDescription,
  imageFile
}: FormPreviewModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageScale, setImageScale] = useState<number>(1);
  const [isExportMode, setIsExportMode] = useState<boolean>(false);

  console.log('FormPreviewModal props:', { 
    components, 
    formName, 
    formDescription, 
    imageFile: imageFile ? 'File present' : 'No file', 
    open,
    componentsLength: components.length 
  });

  const handleInputChange = (componentId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [componentId]: value
    }));
    
    // Clear error when user starts typing
    if (errors[componentId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[componentId];
        return newErrors;
      });
    }
  };

  const validateField = (component: FormComponent, value: any) => {
    if (component.required && (!value || value === '')) {
      return `${component.label} is required`;
    }

    if (component.validation) {
      const { min, max, pattern, message } = component.validation;
      
      if (value && typeof value === 'string') {
        if (min && value.length < min) {
          return message || `${component.label} must be at least ${min} characters`;
        }
        if (max && value.length > max) {
          return message || `${component.label} must be at most ${max} characters`;
        }
        if (pattern && !new RegExp(pattern).test(value)) {
          return message || `${component.label} format is invalid`;
        }
      }

      if (value && typeof value === 'number') {
        if (min && value < min) {
          return message || `${component.label} must be at least ${min}`;
        }
        if (max && value > max) {
          return message || `${component.label} must be at most ${max}`;
        }
      }
    }

    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    components.forEach(component => {
      const value = formData[component.id];
      const error = validateField(component, value);
      if (error) {
        newErrors[component.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Simulate form submission
    toast({
      title: "Form Submitted Successfully!",
      description: "In a real application, this data would be sent to your server.",
    });

    console.log('Form Data:', formData);
  };

  const handleReset = () => {
    setFormData({});
    setErrors({});
  };

  const handleExportPDF = async () => {
    try {
      // Switch to export mode (show text only)
      setIsExportMode(true);
      
      // Wait for re-render
      await new Promise(resolve => setTimeout(resolve, 100));

      const element = document.getElementById('pdf-export-content');
      if (!element) return;

      // Capture the form content as canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });

      // Switch back to preview mode
      setIsExportMode(false);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      pdf.save(`${formName || 'form'}-filled.pdf`);

      toast({
        title: "PDF Exported Successfully!",
        description: "Your form has been saved as a PDF file.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsExportMode(false); // Reset on error
      toast({
        title: "Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderFormField = (component: FormComponent) => {
    console.log('Rendering component:', component);
    const value = formData[component.id] || '';
    const error = errors[component.id];
    const hasError = !!error;

    const commonProps = {
      id: component.id,
      name: component.id,
    };

    const fieldStyle = {
      position: 'absolute' as const,
      left: component.position.x * imageScale,
      top: component.position.y * imageScale,
      width: component.size.width * imageScale,
      minHeight: component.size.height * imageScale,
      zIndex: 10,
    };

    // Export mode: render only text values
    if (isExportMode) {
      const displayValue = (() => {
        switch (component.type) {
          case 'checkbox':
            return value ? '☑' : '☐';
          case 'file':
            return value ? (value.name || 'File attached') : '';
          default:
            return value || '';
        }
      })();

      return (
        <div
          key={component.id}
          style={fieldStyle}
          className="text-sm font-medium text-black bg-transparent"
        >
          {displayValue}
        </div>
      );
    }

    // Preview mode: render fields without rounded corners and minimal styling
    switch (component.type) {
      case 'text':
      case 'email':
        return (
          <Input
            key={component.id}
            {...commonProps}
            type={component.type}
            value={value}
            placeholder={component.placeholder || component.label}
            onChange={(e) => handleInputChange(component.id, e.target.value)}
            style={fieldStyle}
            className={`border border-gray-400 bg-white/90 text-sm rounded-none ${hasError ? 'border-red-500' : ''}`}
          />
        );

      case 'textarea':
        return (
          <Textarea
            key={component.id}
            {...commonProps}
            value={value}
            placeholder={component.placeholder || component.label}
            onChange={(e) => handleInputChange(component.id, e.target.value)}
            style={fieldStyle}
            className={`border border-gray-400 bg-white/90 text-sm resize-none rounded-none ${hasError ? 'border-red-500' : ''}`}
            rows={3}
          />
        );

      case 'select':
        return (
          <div key={component.id} style={fieldStyle}>
            <Select onValueChange={(value) => handleInputChange(component.id, value)}>
              <SelectTrigger className={`border border-gray-400 bg-white/90 text-sm h-auto rounded-none ${hasError ? 'border-red-500' : ''}`}>
                <SelectValue placeholder={component.placeholder || component.label} />
              </SelectTrigger>
              <SelectContent>
                {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'radio':
        return (
          <div key={component.id} style={fieldStyle} className="bg-white/90 p-2 border border-gray-400 rounded-none">
            <RadioGroup
              value={value}
              onValueChange={(value) => handleInputChange(component.id, value)}
              className={hasError ? 'border border-red-500 rounded-none p-1' : ''}
            >
              {(component.options || ['Option 1', 'Option 2', 'Option 3']).map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${component.id}-${index}`} className="scale-75" />
                  <Label htmlFor={`${component.id}-${index}`} className="text-xs cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        );

      case 'checkbox':
        return (
          <div key={component.id} style={fieldStyle} className="bg-white/90 p-2 border border-gray-400 rounded-none flex items-center space-x-2">
            <Checkbox
              {...commonProps}
              checked={value || false}
              onCheckedChange={(checked) => handleInputChange(component.id, checked)}
              className="scale-75"
            />
            <Label htmlFor={component.id} className="text-xs cursor-pointer">
              {component.label}
            </Label>
          </div>
        );

      case 'number':
        return (
          <Input
            key={component.id}
            {...commonProps}
            type="number"
            value={value}
            placeholder={component.placeholder || component.label}
            onChange={(e) => handleInputChange(component.id, parseFloat(e.target.value) || '')}
            style={fieldStyle}
            className={`border border-gray-400 bg-white/90 text-sm rounded-none ${hasError ? 'border-red-500' : ''}`}
          />
        );

      case 'date':
        return (
          <Input
            key={component.id}
            {...commonProps}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(component.id, e.target.value)}
            style={fieldStyle}
            className={`border border-gray-400 bg-white/90 text-sm rounded-none ${hasError ? 'border-red-500' : ''}`}
          />
        );

      case 'file':
        return (
          <div key={component.id} style={fieldStyle} className="space-y-1 bg-white/95 backdrop-blur-sm p-3 rounded-none shadow-sm">
            <Label htmlFor={component.id} className="text-sm font-medium">
              {component.label}
              {component.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="file"
              onChange={(e) => handleInputChange(component.id, e.target.files?.[0])}
              className={hasError ? 'border-red-500' : ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'table':
        return (
          <div key={component.id} style={fieldStyle} className="border border-gray-400 bg-white/90 rounded-none overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {(component.columns || [
                    { id: 'col1', label: 'Column 1', type: 'text' },
                    { id: 'col2', label: 'Column 2', type: 'text' },
                    { id: 'col3', label: 'Column 3', type: 'text' }
                  ]).map((col) => (
                    <th key={col.id} className="px-2 py-1 text-left font-medium border-r border-gray-300 last:border-r-0">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(component.rows || [
                  { col1: 'Data 1', col2: 'Data 2', col3: 'Data 3' },
                  { col1: 'Data 4', col2: 'Data 5', col3: 'Data 6' }
                ]).map((row, index) => (
                  <tr key={index} className="border-t border-gray-300">
                    {(component.columns || [
                      { id: 'col1', label: 'Column 1', type: 'text' },
                      { id: 'col2', label: 'Column 2', type: 'text' },
                      { id: 'col3', label: 'Column 3', type: 'text' }
                    ]).map((col) => (
                      <td key={col.id} className="px-2 py-1 border-r border-gray-300 last:border-r-0">
                        {row[col.id] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'chart':
        return (
          <div key={component.id} style={fieldStyle} className="border border-gray-400 bg-white/90 rounded-none p-4 min-h-[150px] flex items-center justify-center">
            <div className="text-center text-gray-600">
              <div className="w-6 h-6 mx-auto mb-2 border-2 border-gray-400 rounded"></div>
              <p className="text-xs">
                {component.chartType || 'Bar'} Chart
                {component.dataSource && (
                  <span className="block mt-1">
                    Source: {component.dataSource}
                  </span>
                )}
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formContent = (
    <div className="space-y-6">
      {formName && (
        <div className="text-center">
          <h2 className="text-2xl font-bold">{formName}</h2>
          {formDescription && (
            <p className="text-muted-foreground mt-2">{formDescription}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="relative min-h-[500px] border border-dashed border-gray-300">
          {components.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No components to display</p>
            </div>
          ) : (
            components.map(renderFormField)
          )}
          <div className="absolute top-2 left-2 text-xs text-gray-400">
            Components: {components.length}
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button type="submit">
            Submit Form
          </Button>
        </div>
      </form>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Form Preview</DialogTitle>
              <DialogDescription>
                This is how your form will look to users. You can test it by filling it out.
              </DialogDescription>
            </div>
            <Button
              onClick={handleExportPDF}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              data-testid="button-export-pdf"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </DialogHeader>

        <Card className="w-full">
          <CardContent className="p-6">
            {imageFile ? (
              <div id="pdf-export-content" className="relative bg-gray-50 rounded-lg">
                <div className="relative">
                  {/* Background Image fit width, scroll height */}
                  <img
                    src={URL.createObjectURL(imageFile)}
                    alt="Form Background"
                    className="block w-full h-auto max-w-none"
                    style={{
                      width: '100%',
                      height: 'auto',
                    }}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      const container = img.parentElement;
                      if (container) {
                        // Calculate scale ratio: displayed width / natural width
                        const scale = img.clientWidth / img.naturalWidth;
                        setImageScale(scale);
                        console.log('Image scale calculated:', scale, {
                          displayedWidth: img.clientWidth,
                          naturalWidth: img.naturalWidth,
                          displayedHeight: img.clientHeight,
                          naturalHeight: img.naturalHeight
                        });
                      }
                    }}
                  />
                  
                  {/* Form fields overlaid on background */}
                  <form id="preview-form" onSubmit={handleSubmit} className="absolute inset-0 z-10">
                    <div className="relative w-full h-full">
                      {components.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/95 backdrop-blur-sm rounded-lg p-6 shadow-sm">
                            <p className="text-gray-500">No components to display</p>
                          </div>
                        </div>
                      ) : (
                        components.map(renderFormField)
                      )}
                      
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div id="pdf-export-content" className="bg-muted/30 p-6">
                {formContent}
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}