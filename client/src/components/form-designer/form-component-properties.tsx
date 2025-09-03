import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';
import type { FormComponent } from '@/types/form-designer';

interface FormComponentPropertiesProps {
  component: FormComponent;
  allComponents?: FormComponent[];
  onUpdate: (updates: Partial<FormComponent>) => void;
  onClose: () => void;
}

export default function FormComponentProperties({
  component,
  allComponents = [],
  onUpdate,
  onClose
}: FormComponentPropertiesProps) {
  const [options, setOptions] = useState<string[]>(component.options || []);

  const handleBasicUpdate = (field: keyof FormComponent, value: any) => {
    onUpdate({ [field]: value });
  };

  const handleValidationUpdate = (field: string, value: any) => {
    onUpdate({
      validation: {
        ...component.validation,
        [field]: value
      }
    });
  };

  const handlePositionUpdate = (field: 'x' | 'y', value: number) => {
    onUpdate({
      position: {
        ...component.position,
        [field]: value
      }
    });
  };

  const handleSizeUpdate = (field: 'width' | 'height', value: number) => {
    onUpdate({
      size: {
        ...component.size,
        [field]: value
      }
    });
  };

  const addOption = () => {
    const newOptions = [...options, ''];
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate({ options: newOptions });
  };

  const needsOptions = component.type === 'select' || component.type === 'radio';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Field Properties</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto space-y-4">
        {/* Basic Properties */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="label">Label</Label>
            <Input
              id="label"
              value={component.label}
              onChange={(e) => handleBasicUpdate('label', e.target.value)}
              placeholder="Field label"
            />
          </div>

          <div>
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={component.placeholder || ''}
              onChange={(e) => handleBasicUpdate('placeholder', e.target.value)}
              placeholder="Enter placeholder text"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="required"
              checked={component.required || false}
              onCheckedChange={(checked) => handleBasicUpdate('required', checked)}
            />
            <Label htmlFor="required">Required field</Label>
          </div>
        </div>

        <Separator />

        {/* Options for select/radio */}
        {needsOptions && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Options</Label>
              <Button size="sm" variant="outline" onClick={addOption}>
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Table Configuration */}
        {component.type === 'table' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Table Configuration</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Columns</Label>
                <Button size="sm" variant="outline" onClick={() => {
                  const newColumns = [...(component.columns || []), { id: `col${Date.now()}`, label: 'New Column', type: 'text' as const }];
                  onUpdate({ columns: newColumns });
                }}>
                  <Plus className="w-3 h-3 mr-1" />
                  Add Column
                </Button>
              </div>
              {(component.columns || []).map((col, index) => (
                <div key={col.id} className="flex items-center gap-2 p-2 border rounded">
                  <Input
                    value={col.label}
                    onChange={(e) => {
                      const newColumns = [...(component.columns || [])];
                      newColumns[index] = { ...col, label: e.target.value };
                      onUpdate({ columns: newColumns });
                    }}
                    placeholder="Column name"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newColumns = (component.columns || []).filter((_, i) => i !== index);
                      onUpdate({ columns: newColumns });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart Configuration */}
        {component.type === 'chart' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Chart Configuration</Label>
            <div>
              <Label htmlFor="chartType">Chart Type</Label>
              <Select value={component.chartType || 'bar'} onValueChange={(value) => onUpdate({ chartType: value as any })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">Bar Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dataSource">Data Source</Label>
              <Select value={component.dataSource || ''} onValueChange={(value) => onUpdate({ dataSource: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {allComponents
                    .filter(comp => comp.type === 'table')
                    .map((tableComp) => (
                      <SelectItem key={tableComp.id} value={tableComp.id}>
                        {tableComp.label}
                      </SelectItem>
                    ))}
                  {allComponents.filter(comp => comp.type === 'table').length === 0 && (
                    <SelectItem value="" disabled>
                      No tables available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="xAxis">X-Axis Column</Label>
              <Input
                id="xAxis"
                value={component.xAxis || ''}
                onChange={(e) => onUpdate({ xAxis: e.target.value })}
                placeholder="Column name for X-axis"
              />
            </div>
            <div>
              <Label htmlFor="yAxis">Y-Axis Column</Label>
              <Input
                id="yAxis"
                value={component.yAxis || ''}
                onChange={(e) => onUpdate({ yAxis: e.target.value })}
                placeholder="Column name for Y-axis"
              />
            </div>
          </div>
        )}

        <Separator />

        {/* Validation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Validation</Label>
          
          {(component.type === 'text' || component.type === 'textarea') && (
            <>
              <div>
                <Label htmlFor="minLength">Min Length</Label>
                <Input
                  id="minLength"
                  type="number"
                  value={component.validation?.min || ''}
                  onChange={(e) => handleValidationUpdate('min', parseInt(e.target.value) || undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="maxLength">Max Length</Label>
                <Input
                  id="maxLength"
                  type="number"
                  value={component.validation?.max || ''}
                  onChange={(e) => handleValidationUpdate('max', parseInt(e.target.value) || undefined)}
                  placeholder="100"
                />
              </div>
            </>
          )}

          {component.type === 'number' && (
            <>
              <div>
                <Label htmlFor="minValue">Min Value</Label>
                <Input
                  id="minValue"
                  type="number"
                  value={component.validation?.min || ''}
                  onChange={(e) => handleValidationUpdate('min', parseInt(e.target.value) || undefined)}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="maxValue">Max Value</Label>
                <Input
                  id="maxValue"
                  type="number"
                  value={component.validation?.max || ''}
                  onChange={(e) => handleValidationUpdate('max', parseInt(e.target.value) || undefined)}
                  placeholder="100"
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="validationMessage">Custom Error Message</Label>
            <Textarea
              id="validationMessage"
              value={component.validation?.message || ''}
              onChange={(e) => handleValidationUpdate('message', e.target.value)}
              placeholder="Enter custom error message"
              rows={2}
            />
          </div>
        </div>

        <Separator />

        {/* Position & Size */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Position & Size</Label>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="posX">X Position</Label>
              <Input
                id="posX"
                type="number"
                value={component.position.x}
                onChange={(e) => handlePositionUpdate('x', parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="posY">Y Position</Label>
              <Input
                id="posY"
                type="number"
                value={component.position.y}
                onChange={(e) => handlePositionUpdate('y', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                type="number"
                value={component.size.width}
                onChange={(e) => handleSizeUpdate('width', parseInt(e.target.value) || 200)}
              />
            </div>
            <div>
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                type="number"
                value={component.size.height}
                onChange={(e) => handleSizeUpdate('height', parseInt(e.target.value) || 40)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}