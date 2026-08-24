import { TaxonomyNode, PaginationOptions, PaginatedResult } from '../../interfaces';

export interface ITaxonomyProvider {
  readonly name: string;
  initialize(): Promise<void>;
  create(node: TaxonomyNode): Promise<TaxonomyNode>;
  findById(id: string): Promise<TaxonomyNode | null>;
  findBySlug(slug: string): Promise<TaxonomyNode | null>;
  getRootNodes(): Promise<TaxonomyNode[]>;
  getChildren(parentId: string): Promise<TaxonomyNode[]>;
  getAncestors(nodeId: string): Promise<TaxonomyNode[]>;
  getDescendants(nodeId: string): Promise<TaxonomyNode[]>;
  getTree(): Promise<TaxonomyNode[]>;
  update(id: string, data: Partial<TaxonomyNode>): Promise<TaxonomyNode>;
  delete(id: string): Promise<boolean>;
  move(id: string, newParentId: string): Promise<void>;
  reorder(id: string, newOrder: number): Promise<void>;
  search(query: string, options?: PaginationOptions): Promise<PaginatedResult<TaxonomyNode>>;
  dispose(): Promise<void>;
}
