import { ITaxonomyProvider } from './taxonomy-provider.interface';
import { TaxonomyNode, PaginationOptions, PaginatedResult } from '../../interfaces';
import { NotFoundError, CycleError } from '../../errors';

export class MemoryTaxonomyProvider implements ITaxonomyProvider {
  public readonly name = 'memory';
  private nodes = new Map<string, TaxonomyNode>();

  async initialize(): Promise<void> {}

  async create(node: TaxonomyNode): Promise<TaxonomyNode> {
    this.nodes.set(node.id, { ...node });
    return { ...node };
  }

  async findById(id: string): Promise<TaxonomyNode | null> {
    const n = this.nodes.get(id);
    return n ? { ...n } : null;
  }

  async findBySlug(slug: string): Promise<TaxonomyNode | null> {
    for (const n of this.nodes.values()) {
      if (n.slug === slug) return { ...n };
    }
    return null;
  }

  async getRootNodes(): Promise<TaxonomyNode[]> {
    return [...this.nodes.values()]
      .filter(n => !n.parentId)
      .map(n => ({ ...n }));
  }

  async getChildren(parentId: string): Promise<TaxonomyNode[]> {
    return [...this.nodes.values()]
      .filter(n => n.parentId === parentId)
      .map(n => ({ ...n }))
      .sort((a, b) => a.order - b.order);
  }

  async getAncestors(nodeId: string): Promise<TaxonomyNode[]> {
    if (!this.nodes.has(nodeId)) throw new NotFoundError('TaxonomyNode', nodeId);
    const ancestors: TaxonomyNode[] = [];
    let current = this.nodes.get(nodeId);
    const visited = new Set<string>();
    while (current && current.parentId) {
      if (visited.has(current.id)) break;
      visited.add(current.id);
      const parent = this.nodes.get(current.parentId);
      if (parent) {
        ancestors.unshift({ ...parent });
        current = parent;
      } else break;
    }
    return ancestors;
  }

  async getDescendants(nodeId: string): Promise<TaxonomyNode[]> {
    const result: TaxonomyNode[] = [];
    const stack = [nodeId];
    const visited = new Set<string>();
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const n of this.nodes.values()) {
        if (n.parentId === currentId) {
          result.push({ ...n });
          stack.push(n.id);
        }
      }
    }
    return result;
  }

  async getTree(): Promise<TaxonomyNode[]> {
    const visited = new Set<string>();
    const buildTree = (parentId?: string): TaxonomyNode[] => {
      return [...this.nodes.values()]
        .filter(n => n.parentId === parentId)
        .sort((a, b) => a.order - b.order)
        .map(n => {
          if (visited.has(n.id)) return { ...n, children: [] };
          visited.add(n.id);
          return {
            ...n,
            children: buildTree(n.id),
          };
        });
    };
    return buildTree();
  }

  async update(id: string, data: Partial<TaxonomyNode>): Promise<TaxonomyNode> {
    const existing = this.nodes.get(id);
    if (!existing) throw new NotFoundError('TaxonomyNode', id);
    const updated = { ...existing, ...data, id: existing.id };
    this.nodes.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<boolean> {
    if (!this.nodes.has(id)) return false;
    const stack = [id];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (!this.nodes.has(currentId)) continue;
      const children = [...this.nodes.values()].filter(n => n.parentId === currentId);
      for (const child of children) {
        stack.push(child.id);
      }
      this.nodes.delete(currentId);
    }
    return true;
  }

  async move(id: string, newParentId: string): Promise<void> {
    if (id === newParentId) throw new CycleError('TaxonomyNode', id, newParentId);
    const node = this.nodes.get(id);
    if (!node) throw new NotFoundError('TaxonomyNode', id);
    if (newParentId && !this.nodes.has(newParentId)) throw new NotFoundError('TaxonomyNode', newParentId);
    if (this.isDescendant(id, newParentId)) throw new CycleError('TaxonomyNode', id, newParentId);
    node.parentId = newParentId;
  }

  async reorder(id: string, newOrder: number): Promise<void> {
    const node = this.nodes.get(id);
    if (!node) throw new NotFoundError('TaxonomyNode', id);
    node.order = newOrder;
  }

  async search(query: string, options?: PaginationOptions): Promise<PaginatedResult<TaxonomyNode>> {
    const lower = query.toLowerCase();
    const matches = [...this.nodes.values()].filter(n =>
      n.name.toLowerCase().includes(lower) || n.slug.toLowerCase().includes(lower)
    );
    const offset = Math.max(0, options?.offset ?? 0);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
    return {
      items: matches.slice(offset, offset + limit).map(n => ({ ...n })),
      total: matches.length,
      offset,
      limit,
    };
  }

  async dispose(): Promise<void> {
    this.nodes.clear();
  }

  private isDescendant(nodeId: string, targetId: string): boolean {
    const visited = new Set<string>();
    const stack = [nodeId];
    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (currentId === targetId) return true;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const n of this.nodes.values()) {
        if (n.parentId === currentId) {
          stack.push(n.id);
        }
      }
    }
    return false;
  }
}
