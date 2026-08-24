import { Workflow, WorkflowTransition, PublishingState, WorkflowState } from '../../interfaces';

export interface IWorkflowProvider {
  readonly name: string;
  initialize(): Promise<void>;
  createWorkflow(workflow: Workflow): Promise<Workflow>;
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
