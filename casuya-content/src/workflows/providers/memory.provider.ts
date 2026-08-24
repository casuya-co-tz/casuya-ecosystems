import { IWorkflowProvider } from './workflow-provider.interface';
import {
  Workflow,
  WorkflowTransition,
  PublishingState,
  WorkflowState,
  WorkflowHistoryEntry,
} from '../../interfaces';
import { NotFoundError, InvalidStateError } from '../../errors';

export class MemoryWorkflowProvider implements IWorkflowProvider {
  public readonly name = 'memory';
  private workflows = new Map<string, Workflow>();
  private contentAssignments = new Map<string, string>();
  private contentStages = new Map<string, string>();
  private workflowHistory = new Map<string, WorkflowHistoryEntry[]>();

  async initialize(): Promise<void> {}

  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    this.workflows.set(workflow.id, { ...workflow });
    return { ...workflow };
  }

  async getWorkflow(id: string): Promise<Workflow | null> {
    const w = this.workflows.get(id);
    return w ? { ...w } : null;
  }

  async listWorkflows(): Promise<Workflow[]> {
    return [...this.workflows.values()].map(w => ({ ...w }));
  }

  async updateWorkflow(id: string, data: Partial<Workflow>): Promise<Workflow> {
    const existing = this.workflows.get(id);
    if (!existing) throw new Error(`Workflow ${id} not found`);
    const updated = { ...existing, ...data, id: existing.id };
    this.workflows.set(id, updated);
    return { ...updated };
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  async assignContentToWorkflow(contentId: string, workflowId: string): Promise<PublishingState> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) throw new NotFoundError('Workflow', workflowId);
    if (!workflow.stages || workflow.stages.length === 0) {
      throw new InvalidStateError('Workflow', workflowId, 'empty', 'Workflow must have at least one stage');
    }
    this.contentAssignments.set(contentId, workflowId);
    this.contentStages.set(contentId, workflow.stages[0].id);
    this.workflowHistory.set(contentId, []);
    return {
      id: `${contentId}-wf`,
      contentId,
      status: 'draft',
      workflowId,
      stage: workflow.stages[0].id,
      metadata: {},
    };
  }

  async advanceContent(contentId: string, toStageId: string, userId: string, notes?: string): Promise<PublishingState> {
    const wfId = this.contentAssignments.get(contentId);
    if (!wfId) throw new InvalidStateError('Content', contentId, 'unassigned', 'Not assigned to any workflow');
    const workflow = this.workflows.get(wfId);
    if (!workflow) throw new NotFoundError('Workflow', wfId);
    if (!workflow.stages || workflow.stages.length === 0) {
      throw new InvalidStateError('Workflow', wfId, 'empty', 'Workflow has no stages');
    }

    const fromStageId = this.contentStages.get(contentId);
    const transition = workflow.transitions.find(t => t.fromStageId === fromStageId && t.toStageId === toStageId);
    if (!transition) throw new InvalidStateError('Content', contentId, fromStageId ?? 'unknown', `No valid transition to '${toStageId}'`);

    const fromStage = fromStageId;
    const history = this.workflowHistory.get(contentId) || [];
    history.push({
      fromStage,
      toStage: toStageId,
      action: 'advance',
      userId,
      timestamp: new Date(),
      notes,
    });
    this.workflowHistory.set(contentId, history);
    this.contentStages.set(contentId, toStageId);

    const lastStage = workflow.stages[workflow.stages.length - 1];
    const isPublished = lastStage ? toStageId === lastStage.id : false;

    return {
      id: `${contentId}-wf`,
      contentId,
      status: isPublished ? 'published' as const : 'review' as const,
      workflowId: wfId,
      stage: toStageId,
      publishedAt: isPublished ? new Date() : undefined,
      metadata: {},
    };
  }

  async rejectContent(contentId: string, fromStageId: string, userId: string, reason?: string): Promise<PublishingState> {
    const wfId = this.contentAssignments.get(contentId);
    if (!wfId) throw new InvalidStateError('Content', contentId, 'unassigned', 'Not assigned to any workflow');
    const workflow = this.workflows.get(wfId);
    if (!workflow) throw new NotFoundError('Workflow', wfId);

    const firstStage = workflow.stages && workflow.stages.length > 0 ? workflow.stages[0] : undefined;
    const rejectStage = firstStage ? firstStage.id : fromStageId;

    const history = this.workflowHistory.get(contentId) || [];
    history.push({
      fromStage: fromStageId,
      toStage: rejectStage,
      action: 'reject',
      userId,
      timestamp: new Date(),
      notes: reason,
    });
    this.workflowHistory.set(contentId, history);
    this.contentStages.set(contentId, rejectStage);

    return {
      id: `${contentId}-wf`,
      contentId,
      status: 'draft' as const,
      workflowId: wfId || undefined,
      stage: rejectStage,
      metadata: {},
    };
  }

  async getContentWorkflowState(contentId: string): Promise<WorkflowState | null> {
    const wfId = this.contentAssignments.get(contentId);
    if (!wfId) return null;
    const workflow = this.workflows.get(wfId);
    if (!workflow) return null;
    const currentStageId = this.contentStages.get(contentId);
    if (!currentStageId) return null;
    const currentStage = workflow.stages.find(s => s.id === currentStageId);
    if (!currentStage) return null;
    const history = this.workflowHistory.get(contentId) || [];
    return {
      contentId,
      workflow: { ...workflow },
      currentStage: { ...currentStage },
      history: [...history],
    };
  }

  async getAvailableTransitions(contentId: string): Promise<WorkflowTransition[]> {
    const wfId = this.contentAssignments.get(contentId);
    if (!wfId) return [];
    const workflow = this.workflows.get(wfId);
    if (!workflow) return [];
    const currentStageId = this.contentStages.get(contentId);
    if (!currentStageId) return [];
    return workflow.transitions.filter(t => t.fromStageId === currentStageId);
  }

  async getWorkflowContent(workflowId: string): Promise<PublishingState[]> {
    const result: PublishingState[] = [];
    for (const [contentId, wfId] of this.contentAssignments.entries()) {
      if (wfId === workflowId) {
        result.push({
          id: `${contentId}-wf`,
          contentId,
          status: 'draft',
          workflowId,
          stage: this.contentStages.get(contentId),
          metadata: {},
        });
      }
    }
    return result;
  }

  async dispose(): Promise<void> {
    this.workflows.clear();
    this.contentAssignments.clear();
    this.contentStages.clear();
    this.workflowHistory.clear();
  }
}
