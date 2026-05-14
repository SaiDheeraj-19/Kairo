import Docker from 'dockerode';
import fs from 'fs';
import path from 'path';

const docker = new Docker({ socketPath: '/var/run/docker.sock' });

export interface WorkspaceConfig {
  name: string;
  image?: string;
  cpu?: number;
  memory?: number;
}

type PortBindingMap = Record<string, Array<{ HostIp?: string; HostPort?: string }> | null> | undefined;

function hostPortFromInspectPorts(
  ports: PortBindingMap,
  preferKeys: string[]
): number | undefined {
  if (!ports) return undefined;
  for (const key of preferKeys) {
    const binding = ports[key]?.[0]?.HostPort;
    if (binding) return parseInt(binding, 10);
  }
  for (const [, bindings] of Object.entries(ports)) {
    const hp = bindings?.[0]?.HostPort;
    if (hp) return parseInt(hp, 10);
  }
  return undefined;
}

type ListedPort = { PrivatePort: number; PublicPort?: number; Type: string; IP?: string };

/** `docker ps` format: published ports array */
function hostPortFromListPorts(
  ports: ListedPort[],
  preferPrivatePorts: number[]
): number | undefined {
  if (!ports?.length) return undefined;
  for (const priv of preferPrivatePorts) {
    const hit = ports.find((p) => p.PrivatePort === priv && p.PublicPort);
    if (hit?.PublicPort) return hit.PublicPort;
  }
  const any = ports.find((p) => p.PublicPort);
  return any?.PublicPort;
}

export class DockerService {
  private static readonly LABEL_KEY = 'io.kairo.workspace';
  private static readonly DEFAULT_IMAGE = 'codercom/code-server:latest';

  static async createWorkspace(config: WorkspaceConfig) {
    const { name, image: requestedImage, cpu = 0.5, memory = 512 } = config;
    const workspaceId = Math.random().toString(36).substring(2, 10);
    const safeSlug = name.replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 32);
    const containerName = `kairo-ws-${safeSlug}-${workspaceId}`;

    const isDesktop = name.includes('linux') || requestedImage?.includes('kasm');
    const image = requestedImage || (isDesktop ? 'kasmweb/core-ubuntu-focal:1.15.0' : this.DEFAULT_IMAGE);
    const internalPort = isDesktop ? '6901/tcp' : '8080/tcp';

    const storageRoot = process.env.STORAGE_ROOT || '/tmp/kairo/workspaces';
    const hostStoragePath = path.join(storageRoot, workspaceId);
    fs.mkdirSync(hostStoragePath, { recursive: true });

    const binds: string[] = [];
    if (!isDesktop) {
      binds.push(`${hostStoragePath}:/home/coder/project`);
    }

    try {
      await docker.getImage(image).inspect();
    } catch {
      console.log(`Pulling image: ${image}...`);
      await new Promise<void>((resolve, reject) => {
        docker.pull(image, (err: Error | null, stream: NodeJS.ReadableStream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err2: Error | null) => (err2 ? reject(err2) : resolve()));
        });
      });
    }

    const container = await docker.createContainer({
      Image: image,
      name: containerName,
      Labels: {
        [this.LABEL_KEY]: 'true',
        name,
        workspaceId,
      },
      ExposedPorts: { [internalPort]: {} },
      HostConfig: {
        PortBindings: {
          [internalPort]: [{ HostIp: '0.0.0.0', HostPort: '0' }],
        },
        Binds: binds,
        Memory: 1024 * 1024 * memory,
        NanoCpus: Math.max(1, Math.round(cpu * 1e9)),
      },
      Env: ['PASSWORD=kairo', 'VNC_PW=kairo'],
    });

    await container.start();
    const inspect = await container.inspect();
    const port =
      hostPortFromInspectPorts(inspect.NetworkSettings.Ports as PortBindingMap, [
        internalPort,
        '8080/tcp',
        '6901/tcp',
      ]) ?? undefined;

    return {
      id: inspect.Id,
      workspaceId,
      name,
      containerName,
      port: port ?? null,
      status: inspect.State.Status,
      url: port ? `http://localhost:${port}` : null,
      storagePath: hostStoragePath,
    };
  }

  static async listWorkspaces() {
    const containers = await docker.listContainers({ all: true });
    return containers
      .filter((c) => c.Labels[this.LABEL_KEY] === 'true')
      .map((c) => {
        const prefer = c.Image?.includes('kasm') ? [6901, 8080] : [8080, 6901];
        const publicPort = hostPortFromListPorts(c.Ports || [], prefer);
        return {
          id: c.Id,
          name: c.Labels['name'] || c.Names[0]?.replace('/', '') || 'workspace',
          containerName: c.Names[0]?.replace('/', '') || '',
          status: c.State,
          port: publicPort,
          url: publicPort ? `http://localhost:${publicPort}` : null,
          image: c.Image,
        };
      });
  }

  static async stopWorkspace(id: string) {
    const container = docker.getContainer(id);
    try {
      await container.stop({ t: 10 });
    } catch {
      console.warn(`Container ${id} already stopped or missing`);
    }
    try {
      await container.remove({ force: true });
    } catch {
      console.warn(`Container ${id} remove skipped`);
    }
  }

  static async getWorkspace(id: string) {
    const container = docker.getContainer(id);
    const data = await container.inspect();
    const exposed = Object.keys(data.Config.ExposedPorts || {});
    const preferKeys = exposed.length ? exposed : ['8080/tcp', '6901/tcp'];
    const port = hostPortFromInspectPorts(data.NetworkSettings.Ports as PortBindingMap, preferKeys);
    return {
      id: data.Id,
      name: data.Config.Labels['name'],
      status: data.State.Status,
      port: port ?? null,
      url: port ? `http://localhost:${port}` : null,
    };
  }

  static async executeCommand(id: string, command: string) {
    const container = docker.getContainer(id);
    const exec = await container.exec({
      Cmd: ['sh', '-c', command],
      AttachStdout: true,
      AttachStderr: true,
    });

    const stream = await exec.start({ hijack: true, stdin: false });

    return new Promise<string>((resolve, reject) => {
      let output = '';
      stream.on('data', (chunk: Buffer) => {
        output += chunk.toString();
      });
      stream.on('end', () => resolve(output));
      stream.on('error', reject);
    });
  }
}
