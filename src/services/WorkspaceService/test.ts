import WorkspaceService from '.';

describe('WorkspaceService', () => {
  let workspaceService: WorkspaceService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      query: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    workspaceService = new WorkspaceService(mockModel);
  });

  it('should be a module', () => {
    expect(workspaceService).toBeDefined();
  });

  describe('getUserWorkspacesById', () => {
    it('should call the query method from the model', () => {
      workspaceService.getUserWorkspacesById('1');
      expect(mockModel.query).toHaveBeenCalledTimes(1);
    });
  });
  describe('getWorkspaceById', () => {
    it('should call the findOne method from the model', () => {
      workspaceService.getWorkspaceById(1);
      expect(mockModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should call the create and save methods from the model', () => {
      const user = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        password: 'testtest',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const workspace = {
        name: 'test',
        owner: user,
        teammates: [user],
      };
      workspaceService.create(workspace);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.save).toHaveBeenCalledTimes(1);
    });
  });
});
