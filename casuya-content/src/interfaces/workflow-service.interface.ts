import { Workflow, WorkflowStage, WorkflowTransition, PublishingState } from './types';

export interface IWorkflowService {
  readonly name: string;
  initialize(): Promise<void>;
  createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow>;
  getWorkflow(id: string): Promise<Workflow | null>;
  listWorkflows(): Promise<Workflow[]>;
  updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: string): Promise<boolean>;
  assignContentToWorkflow(contentId: string, workflowId: string): Promise<PublishingState>;
  advanceContent(contentId: string, toStageId: string, userId: string, notes?: string): Promise<PublishingState>;
  rejectContent(contentId: string, fromStageId: string, userId: string, reason?: string): Promise<PublishingState>;
  getContentWorkflowState(contentId: string): Promise<WorkflowState | null>;
  getAvailableTransitions(contentId: string): Promise<WorkflowTransition[]>;
  getWorkflowContent(workflowId: string): Promise<PublishingState[]>;
  dispose(): Promise<void>;
}

export interface WorkflowState {
  contentId: string;
  workflow: Workflow;
  currentStage: WorkflowStage;
  history: WorkflowHistoryEntry[];
}

export interface WorkflowHistoryEntry {
  fromStage?: string;
  toStage: string;
  action: 'advance' | 'reject' | 'assign';
  userId: string;
  timestamp: Date;
  notes?: string;
}
