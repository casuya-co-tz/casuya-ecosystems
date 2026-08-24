import { v4 as uuidv4 } from 'uuid';
import {
  IWorkflowService,
  Workflow,
  WorkflowTransition,
  PublishingState,
  WorkflowState,
} from '../interfaces';
import { IWorkflowProvider } from './providers/workflow-provider.interface';

export class WorkflowService implements IWorkflowService {
  public readonly name: string;
  private provider: IWorkflowProvider;
  private initialized = false;

  constructor(provider: IWorkflowProvider) {
    this.name = `workflow-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('WorkflowService not initialized');
  }

  async createWorkflow(workflow: Omit<Workflow, 'id'>): Promise<Workflow> {
    this.check();
    const newWorkflow: Workflow = { ...workflow, id: uuidv4() };
    return this.provider.createWorkflow(newWorkflow);
  }

  async getWorkflow(id: string): Promise<Workflow | null> { this.check(); return this.provider.getWorkflow(id); }
  async listWorkflows(): Promise<Workflow[]> { this.check(); return this.provider.listWorkflows(); }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    this.check();
    return this.provider.updateWorkflow(id, data);
  }

  async deleteWorkflow(id: string): Promise<boolean> { this.check(); return this.provider.deleteWorkflow(id); }

  async assignContentToWorkflow(contentId: string, workflowId: string): Promise<PublishingState> {
    this.check();
    return this.provider.assignContentToWorkflow(contentId, workflowId);
  }

  async advanceContent(contentId: string, toStageId: string, userId: string, notes?: string): Promise<PublishingState> {
    this.check();
    return this.provider.advanceContent(contentId, toStageId, userId, notes);
  }

  async rejectContent(contentId: string, fromStageId: string, userId: string, reason?: string): Promise<PublishingState> {
    this.check();
    return this.provider.rejectContent(contentId, fromStageId, userId, reason);
  }

  async getContentWorkflowState(contentId: string): Promise<WorkflowState | null> {
    this.check();
    return this.provider.getContentWorkflowState(contentId);
  }

  async getAvailableTransitions(contentId: string): Promise<WorkflowTransition[]> {
    this.check();
    return this.provider.getAvailableTransitions(contentId);
  }

  async getWorkflowContent(workflowId: string): Promise<PublishingState[]> {
    this.check();
    return this.provider.getWorkflowContent(workflowId);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
