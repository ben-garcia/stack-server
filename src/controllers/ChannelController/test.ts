import ChannelController from '.';

describe('ChannelController', () => {
  let channelController: ChannelController;
  const mockRequest = {
    body: {
      channel: {
        name: 'channel name',
        description: 'channel description',
        members: [],
        private: false,
        workspace: 6771,
      },
      members: ['channeltest', 'anotherchannellest', 'thirdtest'],
    },
    params: {
      channelId: 5252,
    },
    query: {
      workspaceId: 77,
    },
    session: {
      userId: 899,
      username: 'anothertestuser',
    },
  };
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
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

    function MockChannelService(this: any, mockModel: any) {
      this.channelRepository = mockModel;
      this.create = jest.fn();
      this.getById = jest.fn();
      this.getChannelsByIds = jest.fn();
      this.getMembersByChannelId = jest.fn();
      this.update = jest.fn();
    }

    function MockRedisService(this: any, mockModel: any) {
      this.redisClient = mockModel;
      this.deleteKey = jest.fn();
      this.saveKey = jest.fn();
    }

    function MockUserService(this: any, mockModel: any) {
      this.create = jest.fn();
      this.getByEmail = jest.fn();
      this.getById = jest.fn();
      this.getByUsername = jest.fn();
      this.userRepository = mockModel;
    }

    function MockWorkspaceService(this: any, mockModel: any) {
      this.create = jest.fn();
      this.getUserWorkspacesById = jest.fn();
      this.getWorkspaceById = jest.fn();
      this.workspaceRepository = mockModel;
    }

    channelController = new ChannelController(
      new (MockChannelService as any)(MockModel),
      new (MockRedisService as any)(mockRedis),
      new (MockUserService as any)(MockModel),
      new (MockWorkspaceService as any)(MockModel)
    );
  });

  it('should be a module', () => {
    expect(channelController).toBeDefined();
  });

  describe('getWorkspaceChannels', () => {
    it('should call channelService.getChannelByIds ONLY when channel.length === 0', async () => {
      const { userId } = mockRequest.session;
      const { workspaceId } = mockRequest.query;

      try {
        await channelController.getWorkspaceChannels(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        channelController.channelService.getChannelsByIds
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.getChannelsByIds
      ).toHaveBeenCalledWith(userId, workspaceId);

      expect(channelController.redisService.saveKey).toHaveBeenCalledTimes(0);
    });

    it('should call channelService.getChannelByIds AND redisService.saveKey when channel.length > 0', async () => {
      const { userId, username } = mockRequest.session;
      const { workspaceId } = mockRequest.query;
      const channels = [{ id: 77 }, { id: 3656 }];
      channelController.channelService.getChannelsByIds = jest
        .fn()
        .mockResolvedValueOnce(channels);

      try {
        await channelController.getWorkspaceChannels(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        channelController.channelService.getChannelsByIds
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.getChannelsByIds
      ).toHaveBeenCalledWith(userId, workspaceId);

      expect(channelController.redisService.saveKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.saveKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`,
        channels
      );
    });
  });

  describe('getChannelMembers', () => {
    it('should call channelService.getMembersByChannelId ONLY when channel.members.length === 0', async () => {
      const { channelId } = mockRequest.params;
      const channel = {
        id: 515156,
        members: [],
      };

      channelController.channelService.getMembersByChannelId = jest
        .fn()
        .mockReturnValueOnce(channel);

      try {
        await channelController.getChannelMembers(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledWith(channelId);

      expect(channelController.redisService.saveKey).toHaveBeenCalledTimes(0);
    });

    it('should call channelService.getMembersByChannelId AND redisService.saveKey when channel.members.length > 0', async () => {
      const { channelId } = mockRequest.params;
      const { userId, username } = mockRequest.session;
      const channel = {
        id: 56511,
        members: [
          {
            id: 11147,
          },
        ],
      };

      channelController.channelService.getMembersByChannelId = jest
        .fn()
        .mockReturnValueOnce(channel);

      try {
        await channelController.getChannelMembers(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledWith(channelId);

      expect(channelController.redisService.saveKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.saveKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:members`,
        channel.members
      );
    });
  });

  describe('createChannel', () => {
    it('should call userService.getById, workspaceService.getWorkspaceById, channelService.create, redisService.savekey ONLY when channel.members < 1', async () => {
      const { userId, username } = mockRequest.session;
      const { workspace } = mockRequest.body.channel;
      const user = {
        id: 6116,
      };
      const mockWorkspace = {
        id: 5611777,
      };
      const channel = {
        ...mockRequest.body.channel,
        workspace: mockWorkspace,
        members: [user],
      };

      channelController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(user);

      channelController.workspaceService.getWorkspaceById = jest
        .fn()
        .mockResolvedValueOnce(mockWorkspace);

      channelController.channelService.create = jest
        .fn()
        .mockResolvedValueOnce(channel);

      try {
        await channelController.createChannel(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(channelController.userService.getById).toHaveBeenCalledTimes(1);
      expect(channelController.userService.getById).toHaveBeenCalledWith(
        userId
      );

      expect(channelController.userService.getByUsername).toHaveBeenCalledTimes(
        0
      );

      expect(
        channelController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledWith(workspace);

      expect(channelController.channelService.create).toHaveBeenCalledTimes(1);
      expect(channelController.channelService.create).toHaveBeenCalledWith({
        ...channel,
        workspace: mockWorkspace,
      });

      expect(channelController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`
      );
    });

    it('should call userService.getById, userService.getByUsername , workspaceService.getWorkspaceById, channelService.create, redisService.savekey when channel.members > 1', async () => {
      const { userId, username } = mockRequest.session;
      const { workspace } = mockRequest.body.channel;
      const user = {
        id: 6116,
      };
      const mockWorkspace = {
        id: 5611777,
      };
      const channel = {
        ...mockRequest.body.channel,
        workspace: mockWorkspace,
        members: [user],
      };
      const mockReq = {
        ...mockRequest,
      };

      // pass members
      mockReq.body.channel.members = ['test1', 'test2'] as any;

      channelController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(user);

      channelController.workspaceService.getWorkspaceById = jest
        .fn()
        .mockResolvedValueOnce(mockWorkspace);

      channelController.channelService.create = jest
        .fn()
        .mockResolvedValueOnce(channel);

      try {
        await channelController.createChannel(
          mockReq as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(channelController.userService.getById).toHaveBeenCalledTimes(1);
      expect(channelController.userService.getById).toHaveBeenCalledWith(
        userId
      );

      expect(channelController.userService.getByUsername).toHaveBeenCalledTimes(
        2
      );
      expect(
        channelController.userService.getByUsername
      ).toHaveBeenNthCalledWith(1, 'test1');
      expect(
        channelController.userService.getByUsername
      ).toHaveBeenNthCalledWith(2, 'test2');

      expect(
        channelController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.workspaceService.getWorkspaceById
      ).toHaveBeenCalledWith(workspace);

      expect(channelController.channelService.create).toHaveBeenCalledTimes(1);
      expect(channelController.channelService.create).toHaveBeenCalledWith({
        ...channel,
        workspace: mockWorkspace,
      });

      expect(channelController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`
      );
    });
  });

  describe('updateChannel', () => {
    it('should call userService.getByUsername, channelService.getMembersByChannelId, redisService.deleteKey ONLY when members.length > 0', async () => {
      const channel = {
        members: mockRequest.body.members,
        save: jest.fn(),
      };
      const { channelId } = mockRequest.params;
      const { userId, username } = mockRequest.session;

      channelController.channelService.getMembersByChannelId = jest
        .fn()
        .mockResolvedValueOnce(channel);

      try {
        await channelController.updateChannel(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(channelController.userService.getByUsername).toHaveBeenCalledTimes(
        3
      );
      expect(
        channelController.userService.getByUsername
      ).toHaveBeenNthCalledWith(1, mockRequest.body.members[0]);
      expect(
        channelController.userService.getByUsername
      ).toHaveBeenNthCalledWith(2, mockRequest.body.members[1]);
      expect(
        channelController.userService.getByUsername
      ).toHaveBeenNthCalledWith(3, mockRequest.body.members[2]);

      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.getMembersByChannelId
      ).toHaveBeenCalledWith(channelId);

      expect(channel.save).toHaveBeenCalledTimes(1);

      expect(channelController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`
      );
    });

    it('should call channelService.create when members.length < 0 && req.body has topic property', async () => {
      const { channelId } = mockRequest.params;
      const { userId, username } = mockRequest.session;
      const mockReq: any = { ...mockRequest };
      const topic: string = 'change topic';

      mockReq.body.members = null;
      mockReq.body = {
        topic,
      };

      try {
        await channelController.updateChannel(
          mockReq as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(channelController.channelService.update).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.update
      ).toHaveBeenCalledWith(channelId, { topic });

      expect(channelController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`
      );
    });

    it('should call channelService.create when members.length < 0 && req.body has description property', async () => {
      const { channelId } = mockRequest.params;
      const { userId, username } = mockRequest.session;
      const mockReq: any = { ...mockRequest };
      const description: string = 'change description';

      mockReq.body.members = null;
      mockReq.body = {
        description,
      };

      try {
        await channelController.updateChannel(
          mockReq as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(channelController.channelService.update).toHaveBeenCalledTimes(1);
      expect(
        channelController.channelService.update
      ).toHaveBeenCalledWith(channelId, { description });

      expect(channelController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(channelController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:channels`
      );
    });
  });
});
