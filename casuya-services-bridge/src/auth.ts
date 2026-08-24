import {
  JwtTokenService,
  DefaultPasswordService,
  DefaultAuthenticationService,
  DefaultSessionService,
  DefaultAuthorizationService,
  DefaultPermissionService,
  DefaultPolicyService,
  DefaultMfaService,
  DefaultAuditService,
  MfaMethod,
} from '@casuya/auth';

const users = new Map<string, any>();
const sessions: Map<string, any> = new Map();
const userRoles = new Map<string, string[]>();
const permissions = new Map<string, any>();

let tokenService: JwtTokenService;
let passwordService: DefaultPasswordService;
let authService: DefaultAuthenticationService;
let sessionService: DefaultSessionService;
let authzService: DefaultAuthorizationService;
let permissionService: DefaultPermissionService;
let policyService: DefaultPolicyService;
let mfaService: DefaultMfaService;
let auditService: DefaultAuditService;

const secret = process.env.CASUYA_AUTH_SECRET || 'casuya-bridge-auth-secret';

export async function initAuth() {
  tokenService = new JwtTokenService({
    accessTokenSecret: secret,
    refreshTokenSecret: secret + '-refresh',
    accessTokenExpiration: '15m',
    refreshTokenExpiration: '7d',
  });

  passwordService = new DefaultPasswordService({ resetTokenSecret: secret });

  const userStore = {
    create: async (u: any) => { users.set(u.id, u); return u; },
    findById: async (id: string) => users.get(id) || null,
    findByEmail: async (email: string) => Array.from(users.values()).find((u) => u.email === email) || null,
    findByProvider: async (provider: string, providerId: string) => Array.from(users.values()).find((u) => u.provider === provider && u.providerId === providerId) || null,
  };

  const sessionStore = {
    create: async (s: any) => { sessions.set(s.id, s); return s; },
    findById: async (id: string) => sessions.get(id) || null,
    findByToken: async (token: string) => Array.from(sessions.values()).find((s) => s.token === token) || null,
    findByRefreshToken: async (refreshToken: string) => Array.from(sessions.values()).find((s) => s.refreshToken === refreshToken) || null,
    findByUserId: async (userId: string) => Array.from(sessions.values()).filter((s) => s.userId === userId),
    invalidate: async (id: string) => { const s = sessions.get(id); if (s) { s.isValid = false; } },
    invalidateAllForUser: async (userId: string) => { for (const [k, v] of sessions) if (v.userId === userId) v.isValid = false; },
    updateActivity: async (id: string) => { const s = sessions.get(id); if (s) s.lastActivityAt = new Date(); },
    deleteExpired: async () => { let n = 0; const now = new Date(); for (const [k, v] of sessions) if (v.expiresAt < now || !v.isValid) { sessions.delete(k); n++; } return n; },
  };

  const userRoleStore = {
    getUserRoles: async (userId: string) => userRoles.get(userId) || [],
    getUserPermissions: async (userId: string) => (userRoles.get(userId) || []).map((r) => `${r}:*`),
    assignRole: async (userId: string, role: string) => { const r = userRoles.get(userId) || []; r.push(role); userRoles.set(userId, r); },
    revokeRole: async (userId: string, role: string) => { userRoles.set(userId, (userRoles.get(userId) || []).filter((x) => x !== role)); },
    userHasRole: async (userId: string, role: string) => (userRoles.get(userId) || []).includes(role),
  };

  const permissionStore = {
    create: async (p: any) => { permissions.set(p.id, p); return p; },
    findById: async (id: string) => permissions.get(id) || null,
    findByName: async (name: string) => Array.from(permissions.values()).find((p) => p.name === name) || null,
    findAll: async () => Array.from(permissions.values()),
    findByResource: async (resource: string) => Array.from(permissions.values()).filter((p) => p.resource === resource),
    delete: async (id: string) => { permissions.delete(id); },
    exists: async (name: string) => Array.from(permissions.values()).some((p) => p.name === name),
  };

  const userPermissionStore = {
    userHasPermission: async (userId: string, permissionName: string) => (userRoles.get(userId) || []).some((r) => `${r}:*` === permissionName),
    grantPermission: async (userId: string, permissionName: string) => {
      const userPerms = permissions.get(userId) ?? [];
      if (!userPerms.includes(permissionName)) userPerms.push(permissionName);
      permissions.set(userId, userPerms);
    },
    revokePermission: async (userId: string, permissionName: string) => {
      const userPerms = permissions.get(userId) ?? [];
      permissions.set(userId, userPerms.filter((p: string) => p !== permissionName));
    },
    getUserPermissions: async (userId: string) => (userRoles.get(userId) || []).map((r) => `${r}:*`), };

  authService = new DefaultAuthenticationService(tokenService, sessionStore, userStore);
  sessionService = new DefaultSessionService(sessionStore);
  authzService = new DefaultAuthorizationService(userRoleStore);
  permissionService = new DefaultPermissionService(permissionStore, userPermissionStore);
  policyService = new DefaultPolicyService();
  mfaService = new DefaultMfaService('Casuya');
  auditService = new DefaultAuditService();
}

export const authOps = {
  async register(body: Record<string, unknown>) {
    const userId = 'usr_' + Math.random().toString(36).slice(2, 10);
    const hash = await passwordService.hashPassword(body.password as string);
    const user = { id: userId, email: body.email as string, name: body.name as string, passwordHash: hash, provider: 'local', providerId: null, roles: (body.roles as string[]) || ['student'] };
    users.set(userId, user);
    for (const role of user.roles) {
      const r = userRoles.get(userId) || [];
      r.push(role);
      userRoles.set(userId, r);
    }
    return { id: userId, email: user.email, name: user.name, roles: user.roles };
  },
  async login(body: Record<string, unknown>) {
    return authService.login({
      provider: 'local',
      credentials: { email: body.email as string, password: body.password as string },
    });
  },
  async verifyToken(token: string) {
    return tokenService.verifyAccessToken(token);
  },
  async refresh(body: Record<string, unknown>) {
    return authService.refreshSession(body.refreshToken as string);
  },
  async hashPassword(password: string) {
    return passwordService.hashPassword(password);
  },
  async verifyPassword(password: string, hash: string) {
    return passwordService.verifyPassword(password, hash);
  },
  async checkPermission(body: Record<string, unknown>) {
    return authzService.checkPermission(body as unknown as Parameters<typeof authzService.checkPermission>[0]);
  },
  async getUserRoles(userId: string) {
    return userRoles.get(userId) || [];
  },
  async createPolicy(body: Record<string, unknown>) {
    return policyService.createPolicy(body as Parameters<typeof policyService.createPolicy>[0]);
  },
  async evaluatePolicy(body: Record<string, unknown>) {
    return policyService.evaluate(body as unknown as Parameters<typeof policyService.evaluate>[0]);
  },
  async setupMfa(userId: string, method: string) {
    return mfaService.setupMfa(userId, method as MfaMethod);
  },
  async audit(body: Record<string, unknown>) {
    return auditService.record(body as Parameters<typeof auditService.record>[0]);
  },
};
