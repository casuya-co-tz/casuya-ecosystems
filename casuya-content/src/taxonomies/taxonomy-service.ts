import { v4 as uuidv4 } from 'uuid';
import { ITaxonomyService, TaxonomyNode, PaginationOptions, PaginatedResult } from '../interfaces';
import { ITaxonomyProvider } from './providers/taxonomy-provider.interface';

export class TaxonomyService implements ITaxonomyService {
  public readonly name: string;
  private provider: ITaxonomyProvider;
  private initialized = false;

  constructor(provider: ITaxonomyProvider) {
    this.name = `taxonomy-${provider.name}`;
    this.provider = provider;
  }

  async initialize(): Promise<void> {
    await this.provider.initialize();
    this.initialized = true;
  }

  private check(): void {
    if (!this.initialized) throw new Error('TaxonomyService not initialized');
  }

  async create(node: Omit<TaxonomyNode, 'id'>): Promise<TaxonomyNode> {
    this.check();
    const newNode: TaxonomyNode = { ...node, id: uuidv4() };
    return this.provider.create(newNode);
  }

  async findById(id: string): Promise<TaxonomyNode | null> {
    this.check();
    return this.provider.findById(id);
  }

  async findBySlug(slug: string): Promise<TaxonomyNode | null> {
    this.check();
    return this.provider.findBySlug(slug);
  }

  async getRootNodes(): Promise<TaxonomyNode[]> {
    this.check();
    return this.provider.getRootNodes();
  }

  async getChildren(parentId: string): Promise<TaxonomyNode[]> {
    this.check();
    return this.provider.getChildren(parentId);
  }

  async getAncestors(nodeId: string): Promise<TaxonomyNode[]> {
    this.check();
    return this.provider.getAncestors(nodeId);
  }

  async getDescendants(nodeId: string): Promise<TaxonomyNode[]> {
    this.check();
    return this.provider.getDescendants(nodeId);
  }

  async getTree(): Promise<TaxonomyNode[]> {
    this.check();
    return this.provider.getTree();
  }

  async update(id: string, data: Partial<TaxonomyNode>): Promise<TaxonomyNode> {
    this.check();
    return this.provider.update(id, data);
  }

  async delete(id: string): Promise<boolean> {
    this.check();
    return this.provider.delete(id);
  }

  async move(id: string, newParentId: string): Promise<void> {
    this.check();
    return this.provider.move(id, newParentId);
  }

  async reorder(id: string, newOrder: number): Promise<void> {
    this.check();
    return this.provider.reorder(id, newOrder);
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<TaxonomyNode>> {
    this.check();
    return this.provider.search(query, options);
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }
}
