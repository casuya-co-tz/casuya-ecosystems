import express from 'express';
import http from 'http';
import { ApolloServer } from 'apollo-server-express';
import { IEngine, IContract, IGraphQLContract, ILogger } from '../interfaces';
import { ConsoleLogger, generateRequestId } from '../utilities';
import { SchemaBuilder } from './schema-builder';
import { GraphQLEngineOptions, GraphQLContext } from './types';

function depthLimit(maxDepth: number) {
  return (context: any) => {
    const queries = context.getDocument().definitions.filter(
      (def: any) => def.kind === 'OperationDefinition'
    );
    for (const query of queries) {
      const depth = getDepth(query);
      if (depth > maxDepth) {
        throw new Error(`Query depth ${depth} exceeds maximum allowed depth of ${maxDepth}`);
      }
    }
    return context;
  };
}

function getDepth(node: any, depth = 0): number {
  if (!node.selectionSet) return depth;
  let maxDepth = depth;
  for (const selection of node.selectionSet.selections) {
    const childDepth = getDepth(selection, depth + 1);
    maxDepth = Math.max(maxDepth, childDepth);
  }
  return maxDepth;
}

export class GraphQLEngine implements IEngine {
  readonly protocol = 'graphql' as const;
  readonly name = 'graphql-engine';
  private server: ApolloServer | null = null;
  private app: express.Application;
  private httpServer: http.Server | null = null;
  private schemaBuilder: SchemaBuilder;
  private logger: ILogger;
  private options: GraphQLEngineOptions;
  private running = false;

  constructor(options: GraphQLEngineOptions) {
    this.options = options;
    this.logger = options.logger || new ConsoleLogger();
    this.app = express();
    this.schemaBuilder = new SchemaBuilder();
  }

  registerContract(contract: IContract): void {
    if (this.isGraphQLContract(contract)) {
      this.logger.info(`Registering GraphQL contract: ${contract.name} v${contract.version}`);
      this.schemaBuilder.register(contract);
    }
  }

  getSchemaBuilder(): SchemaBuilder {
    return this.schemaBuilder;
  }

  async start(): Promise<void> {
    if (this.running) {
      this.logger.warn('GraphQL engine is already running');
      return;
    }

    const typeDefs = this.schemaBuilder.buildTypeDefs();
    const resolvers = this.schemaBuilder.buildResolvers();

    this.server = new ApolloServer({
      typeDefs: typeDefs || `type Query { health: String }`,
      resolvers: resolvers as any,
      context: ({ req }): GraphQLContext => ({
        requestId: generateRequestId(),
        ip: req.ip || '',
        timestamp: new Date(),
        headers: req.headers as Record<string, string>,
      }),
      introspection: process.env.NODE_ENV !== 'production',
      validationRules: [depthLimit(10)],
      formatError: (err) => ({
        message: err.message,
        code: err.extensions?.code || 'INTERNAL_ERROR',
        path: err.path,
      }),
    });

    await this.server.start();

    // CSRF/XS-Search workaround for apollo-server-core <= 3.13.0
    // See: https://github.com/apollographql/apollo-server/security/advisories/GHSA-xxxx
    // Blocks Content-Type headers containing "message/" to prevent
    // non-spec-compliant browser exploit. Remove after upgrading to @apollo/server v5.5.0+.
    this.app.use((req, res, next) => {
      for (let i = 0; i < req.rawHeaders.length - 1; i += 2) {
        if (
          req.rawHeaders[i].toLowerCase() === 'content-type' &&
          req.rawHeaders[i + 1].toLowerCase().includes('message/')
        ) {
          return res.status(415).json({ error: 'Content-Type not allowed' });
        }
      }
      return next();
    });

    this.server.applyMiddleware({
      app: this.app as any,
      path: this.options.path || '/graphql',
    });

    return new Promise((resolve) => {
      this.httpServer = this.app.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        this.running = true;
        this.logger.info(`GraphQL engine started on port ${this.options.port}${this.options.path || '/graphql'}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.running) return;

    await this.server?.stop();

    return new Promise((resolve) => {
      this.httpServer?.close(() => {
        this.running = false;
        this.logger.info('GraphQL engine stopped');
        resolve();
      });
    });
  }

  isRunning(): boolean {
    return this.running;
  }

  private isGraphQLContract(contract: IContract): contract is IGraphQLContract {
    return 'typeDefs' in contract;
  }
}
