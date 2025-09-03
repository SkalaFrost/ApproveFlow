import { 
  type User, type InsertUser,
  type Role, type InsertRole,
  type Form, type InsertForm,
  type Workflow, type InsertWorkflow,
  type Document, type InsertDocument,
  type Approval, type InsertApproval,
  users, roles, forms, workflows, documents, approvals
} from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;

  // Roles
  getRole(id: string): Promise<Role | undefined>;
  getRoleByName(name: string): Promise<Role | undefined>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: string, role: Partial<InsertRole>): Promise<Role | undefined>;
  getRoles(): Promise<Role[]>;
  deleteRole(id: string): Promise<boolean>;

  // Forms
  getForm(id: string): Promise<Form | undefined>;
  createForm(form: InsertForm): Promise<Form>;
  updateForm(id: string, form: Partial<InsertForm>): Promise<Form | undefined>;
  getForms(): Promise<Form[]>;
  getFormsByUser(userId: string): Promise<Form[]>;
  deleteForm(id: string): Promise<boolean>;

  // Workflows
  getWorkflow(id: string): Promise<Workflow | undefined>;
  createWorkflow(workflow: InsertWorkflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<InsertWorkflow>): Promise<Workflow | undefined>;
  getWorkflows(): Promise<Workflow[]>;
  getWorkflowsByUser(userId: string): Promise<Workflow[]>;
  deleteWorkflow(id: string): Promise<boolean>;

  // Documents
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, document: Partial<InsertDocument>): Promise<Document | undefined>;
  getDocuments(): Promise<Document[]>;
  getDocumentsByUser(userId: string): Promise<Document[]>;
  getDocumentsByAssignee(userId: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<boolean>;

  // Approvals
  getApproval(id: string): Promise<Approval | undefined>;
  createApproval(approval: InsertApproval): Promise<Approval>;
  updateApproval(id: string, approval: Partial<InsertApproval>): Promise<Approval | undefined>;
  getApprovals(): Promise<Approval[]>;
  getApprovalsByDocument(documentId: string): Promise<Approval[]>;
  getApprovalsByApprover(approverId: string): Promise<Approval[]>;
  getPendingApprovalsByApprover(approverId: string): Promise<Approval[]>;
  deleteApproval(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private roles: Map<string, Role> = new Map();
  private forms: Map<string, Form> = new Map();
  private workflows: Map<string, Workflow> = new Map();
  private documents: Map<string, Document> = new Map();
  private approvals: Map<string, Approval> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default admin user
    const adminId = randomUUID();
    const admin: User = {
      id: adminId,
      username: "admin",
      email: "admin@approvalflow.com",
      password: "admin123",
      firstName: "John",
      lastName: "Doe",
      role: "administrator",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(adminId, admin);

    // Create default roles
    const adminRoleId = randomUUID();
    const adminRole: Role = {
      id: adminRoleId,
      name: "administrator",
      description: "Full system access",
      permissions: { all: true },
      createdAt: new Date(),
    };
    this.roles.set(adminRoleId, adminRole);

    const userRoleId = randomUUID();
    const userRole: Role = {
      id: userRoleId,
      name: "user",
      description: "Standard user access",
      permissions: { read: true, create: true },
      createdAt: new Date(),
    };
    this.roles.set(userRoleId, userRole);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updateUser };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Roles
  async getRole(id: string): Promise<Role | undefined> {
    return this.roles.get(id);
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    return Array.from(this.roles.values()).find(role => role.name === name);
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const id = randomUUID();
    const role: Role = {
      ...insertRole,
      id,
      description: insertRole.description || null,
      createdAt: new Date(),
    };
    this.roles.set(id, role);
    return role;
  }

  async updateRole(id: string, updateRole: Partial<InsertRole>): Promise<Role | undefined> {
    const role = this.roles.get(id);
    if (!role) return undefined;
    
    const updatedRole = { ...role, ...updateRole };
    this.roles.set(id, updatedRole);
    return updatedRole;
  }

  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values());
  }

  async deleteRole(id: string): Promise<boolean> {
    return this.roles.delete(id);
  }

  // Forms
  async getForm(id: string): Promise<Form | undefined> {
    return this.forms.get(id);
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const id = randomUUID();
    const form: Form = {
      ...insertForm,
      id,
      description: insertForm.description || null,
      isActive: insertForm.isActive ?? true,
      workflowId: insertForm.workflowId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.forms.set(id, form);
    return form;
  }

  async updateForm(id: string, updateForm: Partial<InsertForm>): Promise<Form | undefined> {
    const form = this.forms.get(id);
    if (!form) return undefined;
    
    const updatedForm = { ...form, ...updateForm, updatedAt: new Date() };
    this.forms.set(id, updatedForm);
    return updatedForm;
  }

  async getForms(): Promise<Form[]> {
    return Array.from(this.forms.values());
  }

  async getFormsByUser(userId: string): Promise<Form[]> {
    return Array.from(this.forms.values()).filter(form => form.createdBy === userId);
  }

  async deleteForm(id: string): Promise<boolean> {
    return this.forms.delete(id);
  }

  // Workflows
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    return this.workflows.get(id);
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const id = randomUUID();
    const workflow: Workflow = {
      ...insertWorkflow,
      id,
      description: insertWorkflow.description || null,
      isActive: insertWorkflow.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.workflows.set(id, workflow);
    return workflow;
  }

  async updateWorkflow(id: string, updateWorkflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const workflow = this.workflows.get(id);
    if (!workflow) return undefined;
    
    const updatedWorkflow = { ...workflow, ...updateWorkflow, updatedAt: new Date() };
    this.workflows.set(id, updatedWorkflow);
    return updatedWorkflow;
  }

  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflowsByUser(userId: string): Promise<Workflow[]> {
    return Array.from(this.workflows.values()).filter(workflow => workflow.createdBy === userId);
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    return this.workflows.delete(id);
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = {
      ...insertDocument,
      id,
      status: insertDocument.status || "draft",
      workflowId: insertDocument.workflowId || null,
      currentStep: insertDocument.currentStep || null,
      assignedTo: insertDocument.assignedTo || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updateDocument: Partial<InsertDocument>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updateDocument, updatedAt: new Date() };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async getDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.submittedBy === userId);
  }

  async getDocumentsByAssignee(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.assignedTo === userId);
  }

  async deleteDocument(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  // Approvals
  async getApproval(id: string): Promise<Approval | undefined> {
    return this.approvals.get(id);
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const id = randomUUID();
    const approval: Approval = {
      ...insertApproval,
      id,
      status: insertApproval.status || "pending",
      comments: insertApproval.comments || null,
      decidedAt: insertApproval.decidedAt || null,
      createdAt: new Date(),
    };
    this.approvals.set(id, approval);
    return approval;
  }

  async updateApproval(id: string, updateApproval: Partial<InsertApproval>): Promise<Approval | undefined> {
    const approval = this.approvals.get(id);
    if (!approval) return undefined;
    
    const updatedApproval = { ...approval, ...updateApproval };
    this.approvals.set(id, updatedApproval);
    return updatedApproval;
  }

  async getApprovals(): Promise<Approval[]> {
    return Array.from(this.approvals.values());
  }

  async getApprovalsByDocument(documentId: string): Promise<Approval[]> {
    return Array.from(this.approvals.values()).filter(approval => approval.documentId === documentId);
  }

  async getApprovalsByApprover(approverId: string): Promise<Approval[]> {
    return Array.from(this.approvals.values()).filter(approval => approval.approverId === approverId);
  }

  async getPendingApprovalsByApprover(approverId: string): Promise<Approval[]> {
    return Array.from(this.approvals.values()).filter(
      approval => approval.approverId === approverId && approval.status === "pending"
    );
  }

  async deleteApproval(id: string): Promise<boolean> {
    return this.approvals.delete(id);
  }
}

export class PostgreSQLStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL is required for PostgreSQL storage");
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updateUser).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  // Roles
  async getRole(id: string): Promise<Role | undefined> {
    const result = await this.db.select().from(roles).where(eq(roles.id, id));
    return result[0];
  }

  async getRoleByName(name: string): Promise<Role | undefined> {
    const result = await this.db.select().from(roles).where(eq(roles.name, name));
    return result[0];
  }

  async createRole(insertRole: InsertRole): Promise<Role> {
    const result = await this.db.insert(roles).values(insertRole).returning();
    return result[0];
  }

  async updateRole(id: string, updateRole: Partial<InsertRole>): Promise<Role | undefined> {
    const result = await this.db.update(roles).set(updateRole).where(eq(roles.id, id)).returning();
    return result[0];
  }

  async getRoles(): Promise<Role[]> {
    return await this.db.select().from(roles);
  }

  async deleteRole(id: string): Promise<boolean> {
    const result = await this.db.delete(roles).where(eq(roles.id, id)).returning();
    return result.length > 0;
  }

  // Forms
  async getForm(id: string): Promise<Form | undefined> {
    const result = await this.db.select().from(forms).where(eq(forms.id, id));
    return result[0];
  }

  async createForm(insertForm: InsertForm): Promise<Form> {
    const result = await this.db.insert(forms).values(insertForm).returning();
    return result[0];
  }

  async updateForm(id: string, updateForm: Partial<InsertForm>): Promise<Form | undefined> {
    const result = await this.db.update(forms).set(updateForm).where(eq(forms.id, id)).returning();
    return result[0];
  }

  async getForms(): Promise<Form[]> {
    return await this.db.select().from(forms);
  }

  async getFormsByUser(userId: string): Promise<Form[]> {
    return await this.db.select().from(forms).where(eq(forms.createdBy, userId));
  }

  async deleteForm(id: string): Promise<boolean> {
    const result = await this.db.delete(forms).where(eq(forms.id, id)).returning();
    return result.length > 0;
  }

  // Workflows
  async getWorkflow(id: string): Promise<Workflow | undefined> {
    const result = await this.db.select().from(workflows).where(eq(workflows.id, id));
    return result[0];
  }

  async createWorkflow(insertWorkflow: InsertWorkflow): Promise<Workflow> {
    const result = await this.db.insert(workflows).values(insertWorkflow).returning();
    return result[0];
  }

  async updateWorkflow(id: string, updateWorkflow: Partial<InsertWorkflow>): Promise<Workflow | undefined> {
    const result = await this.db.update(workflows).set(updateWorkflow).where(eq(workflows.id, id)).returning();
    return result[0];
  }

  async getWorkflows(): Promise<Workflow[]> {
    return await this.db.select().from(workflows);
  }

  async getWorkflowsByUser(userId: string): Promise<Workflow[]> {
    return await this.db.select().from(workflows).where(eq(workflows.createdBy, userId));
  }

  async deleteWorkflow(id: string): Promise<boolean> {
    const result = await this.db.delete(workflows).where(eq(workflows.id, id)).returning();
    return result.length > 0;
  }

  // Documents
  async getDocument(id: string): Promise<Document | undefined> {
    const result = await this.db.select().from(documents).where(eq(documents.id, id));
    return result[0];
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const result = await this.db.insert(documents).values(insertDocument).returning();
    return result[0];
  }

  async updateDocument(id: string, updateDocument: Partial<InsertDocument>): Promise<Document | undefined> {
    const result = await this.db.update(documents).set(updateDocument).where(eq(documents.id, id)).returning();
    return result[0];
  }

  async getDocuments(): Promise<Document[]> {
    try {
      const result = await this.db.select().from(documents);
      return result;
    } catch (error) {
      console.error("Error in getDocuments:", error);
      throw error;
    }
  }

  async getDocumentsByUser(userId: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(eq(documents.submittedBy, userId));
  }

  async getDocumentsByAssignee(userId: string): Promise<Document[]> {
    return await this.db.select().from(documents).where(eq(documents.assignedTo, userId));
  }

  async deleteDocument(id: string): Promise<boolean> {
    const result = await this.db.delete(documents).where(eq(documents.id, id)).returning();
    return result.length > 0;
  }

  // Approvals
  async getApproval(id: string): Promise<Approval | undefined> {
    const result = await this.db.select().from(approvals).where(eq(approvals.id, id));
    return result[0];
  }

  async createApproval(insertApproval: InsertApproval): Promise<Approval> {
    const result = await this.db.insert(approvals).values(insertApproval).returning();
    return result[0];
  }

  async updateApproval(id: string, updateApproval: Partial<InsertApproval>): Promise<Approval | undefined> {
    const result = await this.db.update(approvals).set(updateApproval).where(eq(approvals.id, id)).returning();
    return result[0];
  }

  async getApprovals(): Promise<Approval[]> {
    return await this.db.select().from(approvals);
  }

  async getApprovalsByDocument(documentId: string): Promise<Approval[]> {
    return await this.db.select().from(approvals).where(eq(approvals.documentId, documentId));
  }

  async getApprovalsByApprover(approverId: string): Promise<Approval[]> {
    return await this.db.select().from(approvals).where(eq(approvals.approverId, approverId));
  }

  async getPendingApprovalsByApprover(approverId: string): Promise<Approval[]> {
    return await this.db.select().from(approvals).where(
      and(eq(approvals.approverId, approverId), eq(approvals.status, "pending"))
    );
  }

  async deleteApproval(id: string): Promise<boolean> {
    const result = await this.db.delete(approvals).where(eq(approvals.id, id)).returning();
    return result.length > 0;
  }
}

// Choose storage based on environment and DATABASE_URL availability
// Temporarily using MemStorage due to SSL certificate issues with external Neon database
// PostgreSQL storage is ready and can be enabled once database is properly configured
export const storage = new MemStorage();
