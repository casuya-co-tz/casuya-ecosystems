import { WorkflowService, MemoryWorkflowProvider } from '../../src/workflows';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(async () => {
    const provider = new MemoryWorkflowProvider();
    service = new WorkflowService(provider);
    await service.initialize();
  });

  it('should create and retrieve workflows', async () => {
    const workflow = await service.createWorkflow({
      name: 'Editorial Review',
      stages: [
        { id: 'draft', name: 'Draft', order: 1, requiredApprovals: 0, metadata: {} },
        { id: 'review', name: 'In Review', order: 2, requiredApprovals: 1, metadata: {} },
        { id: 'published', name: 'Published', order: 3, requiredApprovals: 0, metadata: {} },
      ],
      transitions: [
        { fromStageId: 'draft', toStageId: 'review', metadata: {} },
        { fromStageId: 'review', toStageId: 'published', metadata: {} },
        { fromStageId: 'review', toStageId: 'draft', metadata: {} },
      ],
      metadata: {},
    });

    const found = await service.getWorkflow(workflow.id);
    expect(found).not.toBeNull();
    expect(found!.stages).toHaveLength(3);
  });

  it('should assign content to workflow and track state', async () => {
    const workflow = await service.createWorkflow({
      name: 'Simple Review',
      stages: [
        { id: 'draft', name: 'Draft', order: 1, requiredApprovals: 0, metadata: {} },
        { id: 'published', name: 'Published', order: 2, requiredApprovals: 0, metadata: {} },
      ],
      transitions: [
        { fromStageId: 'draft', toStageId: 'published', metadata: {} },
      ],
      metadata: {},
    });

    await service.assignContentToWorkflow('content-1', workflow.id);
    const state = await service.getContentWorkflowState('content-1');
    expect(state).not.toBeNull();
    expect(state!.currentStage.id).toBe('draft');
  });

  it('should advance content through stages', async () => {
    const workflow = await service.createWorkflow({
      name: 'Approval',
      stages: [
        { id: 'draft', name: 'Draft', order: 1, requiredApprovals: 0, metadata: {} },
        { id: 'approved', name: 'Approved', order: 2, requiredApprovals: 0, metadata: {} },
      ],
      transitions: [
        { fromStageId: 'draft', toStageId: 'approved', metadata: {} },
      ],
      metadata: {},
    });

    await service.assignContentToWorkflow('content-1', workflow.id);
    const result = await service.advanceContent('content-1', 'approved', 'reviewer-1');
    expect(result.status).toBe('published');
    expect(result.stage).toBe('approved');
  });

  it('should reject content back to first stage', async () => {
    const workflow = await service.createWorkflow({
      name: 'Review Flow',
      stages: [
        { id: 'draft', name: 'Draft', order: 1, requiredApprovals: 0, metadata: {} },
        { id: 'review', name: 'Review', order: 2, requiredApprovals: 1, metadata: {} },
      ],
      transitions: [
        { fromStageId: 'draft', toStageId: 'review', metadata: {} },
        { fromStageId: 'review', toStageId: 'draft', metadata: {} },
      ],
      metadata: {},
    });

    await service.assignContentToWorkflow('content-1', workflow.id);
    await service.advanceContent('content-1', 'review', 'author');
    const rejected = await service.rejectContent('content-1', 'review', 'reviewer', 'Needs revision');
    expect(rejected.stage).toBe('draft');
  });

  it('should get available transitions', async () => {
    const workflow = await service.createWorkflow({
      name: 'Test',
      stages: [
        { id: 'a', name: 'A', order: 1, requiredApprovals: 0, metadata: {} },
        { id: 'b', name: 'B', order: 2, requiredApprovals: 0, metadata: {} },
      ],
      transitions: [
        { fromStageId: 'a', toStageId: 'b', metadata: {} },
      ],
      metadata: {},
    });

    await service.assignContentToWorkflow('content-1', workflow.id);
    const transitions = await service.getAvailableTransitions('content-1');
    expect(transitions).toHaveLength(1);
    expect(transitions[0].toStageId).toBe('b');
  });
});
