import WorkspaceController from '.';

describe('WorkspaceController', () => {
  let workspaceController: WorkspaceController;
  const mockRequest = {
    body: {
      name: 'thename',
      owner: 100,
    },
    params: {
      workspaceId: 6,
    },
    session: {
      userId: 1,
      username: 'testusername',
    },
  };
  const mockResponse = {
    status: jest.fn(),
    json: jest.fn(),
  };

  beforeEach(() => {
    const MockModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    const mockRedis = {
      setex: jest.fn(),
      del: jest.fn(),
    };

    function MockRedisService(this: any, mockModel: any) {
      this.redisClient = mockModel;
      this.deleteKey = jest.fn();
      this.saveKey = jest.fn();
    }

    function MockUserService(this: any, mockModel: any) {
      this.userRepository = mockModel;
      this.getByEmail = jest.fn();
      this.getById = jest.fn();
      this.getByUsername = jest.fn();
      this.create = jest.fn();
    }

    function MockWorkspaceService(this: any, mockModel: any) {
      this.create = jest.fn();
      this.getUserWorkspacesById = jest.fn();
      this.getWorkspaceById = jest.fn();
      this.workspaceRepository = mockModel;
    }

    workspaceController = new WorkspaceController(
      new (MockRedisService as any)(mockRedis),
      new (MockUserService as any)(MockModel),
      new (MockWorkspaceService as any)(MockModel)
    );
  });

  it('should be a module', () => {
    expect(workspaceController).toBeDefined();
  });

  describe('getUsersWorkspaces', () => {
    it('should call getUserWorkspacesById from WorkspaceService', async () => {
      try {
        await workspaceController.getUserWorkspaces(
          mockRequest as any,
          mockResponse as any
        );

        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        workspaceController.workspaceService.getUserWorkspacesById
      ).toHaveBeenCalledTimes(1);
      expect(
        workspaceController.workspaceService.getUserWorkspacesById
      ).toHaveBeenCalledWith(mockRequest.session.userId);
    });

    it('should not call saveKey from RedisService when workspaceService.getUserWorkspacesById return an array.length === 0', async () => {
      workspaceController.workspaceService.getUserWorkspacesById = jest.fn();

      try {
        await workspaceController.getUserWorkspaces(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(workspaceController.redisService.saveKey).toHaveBeenCalledTimes(0);
    });

    it('should call saveKey from RedisService when workspaceService.getUserWorkspacesById return an array.length > 0', async () => {
      workspaceController.workspaceService.getUserWorkspacesById = jest
        .fn()
        .mockImplementationOnce(() => [{ id: 1 }]);

      try {
        await workspaceController.getUserWorkspaces(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      const { userId, username } = mockRequest.session;

      expect(workspaceController.redisService.saveKey).toHaveBeenCalledTimes(1);
      expect(
        workspaceController.redisService.saveKey
      ).toHaveBeenCalledWith(`user:${userId}-${username}:workspaces`, [
        { id: 1 },
      ]);
    });
  });

  describe('getWorkspaceTeammates', () => {
    it('should call workspaceService.getWorkspaceById', async () => {
      try {
        await workspaceController.getWorkspaceTeammates(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        workspaceController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledTimes(1);
      expect(
        workspaceController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledWith(mockRequest.params.workspaceId);
    });

    it('should not call saveKey from RedisService when teamamtes.length === 0', async () => {
      workspaceController.workspaceService.getUserWorkspacesById = jest.fn();

      try {
        await workspaceController.getWorkspaceTeammates(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(workspaceController.redisService.saveKey).toHaveBeenCalledTimes(0);
    });

    it('should call saveKey from RedisService when teammates.length > 0', async () => {
      const teammate = { id: 20, username: 'testtestuser' };

      workspaceController.workspaceService.getWorkspaceById = jest
        .fn()
        .mockResolvedValueOnce({
          id: 20,
          teammates: [teammate],
        });

      try {
        await workspaceController.getWorkspaceTeammates(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      const { userId, username } = mockRequest.session;

      expect(workspaceController.redisService.saveKey).toHaveBeenCalledTimes(1);
      expect(
        workspaceController.redisService.saveKey
      ).toHaveBeenCalledWith(`user:${userId}-${username}:teammates`, [
        teammate,
      ]);
    });
  });
});
