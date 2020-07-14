import { Repository } from 'typeorm';

import { Workspace } from '../../entity';

interface UserDTO {
  id: number;
  username: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkspaceDTO {
  name: string;
  owner: UserDTO;
  teammates: UserDTO[];
}

class WorkspaceService {
  private workspaceRepository: Repository<Workspace>;

  constructor(workspaceRepository: Repository<Workspace>) {
    this.workspaceRepository = workspaceRepository;
  }

  async getUserWorkspacesById(userId: string): Promise<Workspace[]> {
    return this.workspaceRepository.query(`
        SELECT workspaces.id, workspaces.name, workspaces."ownerId" FROM workspaces INNER JOIN user_workspaces ON workspaces.id = user_workspaces.workspace INNER JOIN users ON user_workspaces.user = users.id and users.id = ${userId}`);
  }

  async getWorkspaceById(workspaceId: number): Promise<Workspace | undefined> {
    return this.workspaceRepository.findOne({
      where: { id: workspaceId },
      relations: ['teammates'],
    });
  }

  async create(workspace: WorkspaceDTO): Promise<Workspace> {
    const newWorkspace = this.workspaceRepository.create(workspace);
    await this.workspaceRepository.save(newWorkspace);

    return newWorkspace;
  }
}

export default WorkspaceService;
