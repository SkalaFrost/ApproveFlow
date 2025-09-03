export interface WorkflowStep {
  id: string;
  name: string;
  type: 'approval' | 'notification' | 'condition' | 'action';
  assigneeId?: string;
  assigneeRole?: string;
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  };
  action?: {
    type: 'email' | 'webhook' | 'update_field';
    config: any;
  };
  position: {
    x: number;
    y: number;
  };
  connections: string[];
}

export interface WorkflowSchema {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  triggers: {
    formSubmitted?: boolean;
    statusChanged?: boolean;
    timeDelay?: number;
  };
  settings: {
    autoStart?: boolean;
    allowReassign?: boolean;
    sendNotifications?: boolean;
  };
}
