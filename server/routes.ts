import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertRoleSchema, insertFormSchema, 
  insertWorkflowSchema, insertDocumentSchema, insertApprovalSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Users API
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      res.status(201).json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const updatedUser = await storage.updateUser(req.params.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Roles API
  app.get("/api/roles", async (req, res) => {
    try {
      const roles = await storage.getRoles();
      res.json(roles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch roles" });
    }
  });

  app.post("/api/roles", async (req, res) => {
    try {
      const validatedData = insertRoleSchema.parse(req.body);
      const role = await storage.createRole(validatedData);
      res.status(201).json(role);
    } catch (error) {
      res.status(400).json({ message: "Invalid role data" });
    }
  });

  // Forms API
  app.get("/api/forms", async (req, res) => {
    try {
      const forms = await storage.getForms();
      res.json(forms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(form);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  app.post("/api/forms", async (req, res) => {
    try {
      const validatedData = insertFormSchema.parse(req.body);
      const form = await storage.createForm(validatedData);
      res.status(201).json(form);
    } catch (error) {
      res.status(400).json({ message: "Invalid form data" });
    }
  });

  app.patch("/api/forms/:id", async (req, res) => {
    try {
      const updatedForm = await storage.updateForm(req.params.id, req.body);
      if (!updatedForm) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(updatedForm);
    } catch (error) {
      res.status(500).json({ message: "Failed to update form" });
    }
  });

  app.delete("/api/forms/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteForm(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // Workflows API
  app.get("/api/workflows", async (req, res) => {
    try {
      const workflows = await storage.getWorkflows();
      res.json(workflows);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflows" });
    }
  });

  app.get("/api/workflows/:id", async (req, res) => {
    try {
      const workflow = await storage.getWorkflow(req.params.id);
      if (!workflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(workflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.post("/api/workflows", async (req, res) => {
    try {
      const validatedData = insertWorkflowSchema.parse(req.body);
      const workflow = await storage.createWorkflow(validatedData);
      res.status(201).json(workflow);
    } catch (error) {
      res.status(400).json({ message: "Invalid workflow data" });
    }
  });

  app.patch("/api/workflows/:id", async (req, res) => {
    try {
      const updatedWorkflow = await storage.updateWorkflow(req.params.id, req.body);
      if (!updatedWorkflow) {
        return res.status(404).json({ message: "Workflow not found" });
      }
      res.json(updatedWorkflow);
    } catch (error) {
      res.status(500).json({ message: "Failed to update workflow" });
    }
  });

  // Documents API
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/documents/:id", async (req, res) => {
    try {
      const document = await storage.getDocument(req.params.id);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.status(201).json(document);
    } catch (error) {
      res.status(400).json({ message: "Invalid document data" });
    }
  });

  app.patch("/api/documents/:id", async (req, res) => {
    try {
      const updatedDocument = await storage.updateDocument(req.params.id, req.body);
      if (!updatedDocument) {
        return res.status(404).json({ message: "Document not found" });
      }
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Approvals API
  app.get("/api/approvals", async (req, res) => {
    try {
      const { approverId, documentId } = req.query;
      let approvals;
      
      if (approverId) {
        approvals = await storage.getApprovalsByApprover(approverId as string);
      } else if (documentId) {
        approvals = await storage.getApprovalsByDocument(documentId as string);
      } else {
        approvals = await storage.getApprovals();
      }
      
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/pending/:approverId", async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovalsByApprover(req.params.approverId);
      res.json(approvals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending approvals" });
    }
  });

  app.post("/api/approvals", async (req, res) => {
    try {
      const validatedData = insertApprovalSchema.parse(req.body);
      const approval = await storage.createApproval(validatedData);
      res.status(201).json(approval);
    } catch (error) {
      res.status(400).json({ message: "Invalid approval data" });
    }
  });

  app.patch("/api/approvals/:id", async (req, res) => {
    try {
      const updatedApproval = await storage.updateApproval(req.params.id, req.body);
      if (!updatedApproval) {
        return res.status(404).json({ message: "Approval not found" });
      }
      res.json(updatedApproval);
    } catch (error) {
      res.status(500).json({ message: "Failed to update approval" });
    }
  });

  // Dashboard metrics API
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      const approvals = await storage.getApprovals();
      const workflows = await storage.getWorkflows();
      
      const pendingApprovals = approvals.filter(a => a.status === "pending").length;
      const activeWorkflows = workflows.filter(w => w.isActive).length;
      const completedDocuments = documents.filter(d => d.status === "completed").length;
      const completionRate = documents.length > 0 ? (completedDocuments / documents.length * 100).toFixed(1) : "0";

      res.json({
        totalDocuments: documents.length,
        pendingApprovals,
        activeWorkflows,
        completionRate: parseFloat(completionRate),
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
