export interface Workspace {
  id: string;
  name: string;
  containerName: string;
  status: 'running' | 'stopped' | 'creating';
  port?: number;
  url?: string;
  image: string;
  cpu?: number;
  memory?: number;
}

export interface CreateWorkspaceDto {
  name: string;
  image?: string;
  cpu?: number;
  memory?: number;
}
