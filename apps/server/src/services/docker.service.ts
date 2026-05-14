import Docker from 'dockerode';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface WorkspaceConfig {
  name: string;
  image?: string;
  cpu?: number;
  memory?: number;
}

export class DockerService {
  private static readonly LABEL_KEY = 'io.kairo.workspace';
  private static readonly DEFAULT_IMAGE = 'codercom/code-server:latest';

  static async createWorkspace(config: WorkspaceConfig) {
    const { name, image: requestedImage, cpu = 0.5, memory = 512 } = config;
    const workspaceId = Math.random().toString(36).substring(7);
    const containerName = `kairo-ws-${name}-${workspaceId}`;
    
    // Determine image and port based on name prefix or explicit config
    const isDesktop = name.includes('linux') || requestedImage?.includes('kasm');
    const image = requestedImage || (isDesktop ? 'kasmweb/core-ubuntu-focal:1.15.0' : this.DEFAULT_IMAGE);
    const internalPort = isDesktop ? '6901/tcp' : '8080/tcp';
    
    // Assign a random port in the 8000-9000 range
    const port = Math.floor(Math.random() * 1000) + 8000;

    // Define host storage path
    const storageRoot = process.env.STORAGE_ROOT || '/tmp/kairo/workspaces';
    const hostStoragePath = `${storageRoot}/${workspaceId}`;

    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Labels: { [this.LABEL_KEY]: 'true', 'name': name, 'workspaceId': workspaceId },
      ExposedPorts: { [internalPort]: {} },
      HostConfig: {
        PortBindings: { [internalPort]: [{ HostPort: port.toString() }] },
        Binds: [`${hostStoragePath}:/home/coder/project`],
        Memory: 1024 * 1024 * memory,
        NanoCpus: cpu * 1e9,
      },
      Env: [
        'PASSWORD=kairo', 
        'VNC_PW=kairo',
      ],
    });

    await container.start();

    return {
      id: container.id,
      name: name,
      containerName: containerName,
      port: port,
      status: 'running',
      url: `http://localhost:${port}`
    };
  }

  static async listWorkspaces() {
    const containers = await docker.listContainers({ all: true });
    return containers
      .filter(c => c.Labels[this.LABEL_KEY] === 'true')
      .map(c => ({
        id: c.Id,
        name: c.Labels['name'] || c.Names[0].replace('/', ''),
        containerName: c.Names[0].replace('/', ''),
        status: c.State,
        port: c.Ports[0]?.PublicPort,
        url: c.Ports[0]?.PublicPort ? `http://localhost:${c.Ports[0].PublicPort}` : null,
        image: c.Image
      }));
  }

  static async stopWorkspace(id: string) {
    const container = docker.getContainer(id);
    try {
      await container.stop();
    } catch (e) {
      console.warn(`Container ${id} already stopped`);
    }
    await container.remove();
  }
  
  static async getWorkspace(id: string) {
    const container = docker.getContainer(id);
    const data = await container.inspect();
    return {
      id: data.Id,
      name: data.Config.Labels['name'],
      status: data.State.Status,
      port: data.NetworkSettings.Ports['8080/tcp']?.[0]?.HostPort
    };
  }

  static async executeCommand(id: string, command: string) {
    const container = docker.getContainer(id);
    const exec = await container.exec({
      Cmd: ['sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: true });
    
    return new Promise((resolve, reject) => {
      let output = '';
      stream.on('data', (chunk) => {
        output += chunk.toString();
      });
      stream.on('end', () => {
        resolve(output);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    });
  }
}
