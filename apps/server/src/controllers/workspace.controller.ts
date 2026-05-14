import { Request, Response } from 'express';
import { DockerService } from '../services/docker.service';

export class WorkspaceController {
  static async list(req: Request, res: Response) {
    try {
      const workspaces = await DockerService.listWorkspaces();
      res.json(workspaces);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, image, cpu, memory } = req.body;
      if (!name) return res.status(400).json({ error: 'Workspace name is required' });

      const workspace = await DockerService.createWorkspace({ name, image, cpu, memory });
      res.status(201).json(workspace);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await DockerService.stopWorkspace(id);
      res.json({ message: 'Workspace deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  static async execute(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { command } = req.body;
      if (!command) return res.status(400).json({ error: 'Command is required' });

      const output = await DockerService.executeCommand(id, command);
      res.json({ output });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
