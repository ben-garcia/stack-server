import DirectMessageController from '.';

describe('DirectMessageController', () => {
  let directMessageController: DirectMessageController;
  const mockRequest = {
    body: {
      message: {
        channel: 1998,
        content: 'direct content for message',
        user: 3564,
        workspaceId: 6267,
      },
    },
    query: {
      channelId: 96949,
      teammateId: 659,
      workspaceId: 76654,
    },
    session: {
      userId: 96698,
      username: 'username252666',
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

    function MockDirectMessageService(this: any, mockModel: any) {
      this.directMessageRepository = mockModel;
      this.create = jest.fn();
      this.getByIds = jest.fn();
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

    directMessageController = new DirectMessageController(
      new (MockDirectMessageService as any)(MockModel),
      new (MockRedisService as any)(mockRedis),
      new (MockUserService as any)(MockModel)
    );
  });

  it('should be a module', () => {
    expect(directMessageController).toBeDefined();
  });

  describe('getUserDirectMessages', () => {
    it('should call userService.getById, directMessageService.getByIds and redisService.saveKey when directMessages.length > 0', async () => {
      const { teammateId, workspaceId } = mockRequest.query;
      const { userId, username } = mockRequest.session;
      const user = {
        id: 26644,
      };
      const directMessages = [
        {
          id: 949868,
          user: {
            password: 'kahg9a0g0agu',
            id: 79558,
            email: 'kajga9gua9gaug9',
            updatedAt: '3952j52525',
            createdAt: '99g9gg9g9g9',
          },
        },
        {
          id: 63963,
          user: {
            password: 'jag999',
            id: 9965858,
            email: 'js9ga9',
            updatedAt: 'sjkgaj195u2595',
            createdAt: '25252525jjg9g9g9',
          },
        },
      ];

      directMessageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(user);

      directMessageController.directMessageService.getByIds = jest
        .fn()
        .mockResolvedValueOnce(directMessages);

      try {
        await directMessageController.getUserDirectMessages(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(directMessageController.userService.getById).toHaveBeenCalledTimes(
        1
      );
      expect(directMessageController.userService.getById).toHaveBeenCalledWith(
        userId
      );

      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledTimes(1);
      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledWith(teammateId, workspaceId, userId);

      expect(
        directMessageController.redisService.saveKey
      ).toHaveBeenCalledTimes(1);
      expect(directMessageController.redisService.saveKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:directMessages`,
        directMessages
      );
    });

    it('should call userService.getById, directMessageService.getByIds ONLY when directMessages.length === 0', async () => {
      const { teammateId, workspaceId } = mockRequest.query;
      const { userId } = mockRequest.session;
      const user = {
        id: 26644,
      };

      directMessageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(user);

      directMessageController.directMessageService.getByIds = jest
        .fn()
        .mockResolvedValueOnce([]);

      try {
        await directMessageController.getUserDirectMessages(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(directMessageController.userService.getById).toHaveBeenCalledTimes(
        1
      );
      expect(directMessageController.userService.getById).toHaveBeenCalledWith(
        userId
      );

      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledTimes(1);
      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledWith(teammateId, workspaceId, userId);

      expect(
        directMessageController.redisService.saveKey
      ).toHaveBeenCalledTimes(0);
    });

    it('should call userService.getById ONLY when user is not found in db', async () => {
      directMessageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      try {
        await directMessageController.getUserDirectMessages(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(directMessageController.userService.getById).toHaveBeenCalledTimes(
        1
      );

      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledTimes(0);

      expect(
        directMessageController.directMessageService.getByIds
      ).toHaveBeenCalledTimes(0);

      expect(
        directMessageController.redisService.saveKey
      ).toHaveBeenCalledTimes(0);
    });
  });

  describe('createDirectMessage', () => {
    it('should call userService.getById, directMessageService.create, messageService.create, redisService.deleteKey when user is found in db', async () => {
      const {
        user: directMessageUserId,
        workspaceId,
      } = mockRequest.body.message;
      const { userId, username } = mockRequest.session;
      const mockUser = 242555;
      const mockReq = { ...mockRequest };
      const mockDirectMessage = {
        content: mockRequest.body.message.content,
        user: mockUser,
        workspaceId,
      };
      const directMessage = {
        ...mockDirectMessage,
      };

      delete mockReq.body.message.channel;

      directMessageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(mockUser);

      directMessageController.directMessageService.create = jest
        .fn()
        .mockResolvedValueOnce(mockDirectMessage);

      try {
        await directMessageController.createDirectMessage(
          mockReq as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(directMessageController.userService.getById).toHaveBeenCalledTimes(
        1
      );
      expect(directMessageController.userService.getById).toHaveBeenCalledWith(
        directMessageUserId
      );

      expect(
        directMessageController.directMessageService.create
      ).toHaveBeenCalledTimes(1);
      expect(
        directMessageController.directMessageService.create
      ).toHaveBeenCalledWith(directMessage);

      expect(
        directMessageController.redisService.deleteKey
      ).toHaveBeenCalledTimes(1);
      expect(
        directMessageController.redisService.deleteKey
      ).toHaveBeenCalledWith(`user:${userId}-${username}:directMessages`);
    });

    it('should call userService.getById ONLY when user is not found in db', async () => {
      const { user: directMessageUserId } = mockRequest.body.message;

      directMessageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(undefined);

      try {
        await directMessageController.createDirectMessage(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(directMessageController.userService.getById).toHaveBeenCalledTimes(
        1
      );
      expect(directMessageController.userService.getById).toHaveBeenCalledWith(
        directMessageUserId
      );

      expect(
        directMessageController.directMessageService.create
      ).toHaveBeenCalledTimes(0);

      expect(
        directMessageController.redisService.deleteKey
      ).toHaveBeenCalledTimes(0);
    });
  });
});
