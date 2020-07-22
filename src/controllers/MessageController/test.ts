import MessageController from '.';

describe('MessageController', () => {
  let messageController: MessageController;
  const mockRequest = {
    body: {
      message: {
        channel: 9414,
        content: 'content for message',
        user: 1366,
      },
    },
    query: {
      channelId: 562,
    },
    session: {
      userId: 96698,
      username: 'messagesUsername',
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

    function MockMessageService(this: any, mockModel: any) {
      this.create = jest.fn();
      this.getAllByChannelId = jest.fn();
      this.messageRepository = mockModel;
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

    messageController = new MessageController(
      new (MockChannelService as any)(MockModel),
      new (MockMessageService as any)(MockModel),
      new (MockRedisService as any)(mockRedis),
      new (MockUserService as any)(MockModel)
    );
  });

  it('should be a module', () => {
    expect(messageController).toBeDefined();
  });

  describe('getChannelMessages', () => {
    it('should call messagesService.getAllByChannelId and redisService.saveKey when messages.length > 0', async () => {
      const { channelId } = mockRequest.query;
      const { userId, username } = mockRequest.session;
      const messages = [
        {
          id: 52661,
          user: {
            password: 'gg',
            id: 52,
            email: '2kjtk2tj2jtkg',
            updatedAt: 'kjskjfajkf',
            createdAt: 'jkjij2j2',
          },
        },
        {
          id: 261166,
          user: {
            password: '02jjskgksjgk',
            id: 2626,
            email: 'js9ijw9j9jh9j9gs',
            updatedAt: 'igjag9a9gja9jg9ag9',
            createdAt: 'h55h6h6h6h6h',
          },
        },
      ];

      messageController.messageService.getAllByChannelId = jest
        .fn()
        .mockResolvedValueOnce(messages);

      try {
        await messageController.getChannelMessages(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        messageController.messageService.getAllByChannelId
      ).toHaveBeenCalledTimes(1);
      expect(
        messageController.messageService.getAllByChannelId
      ).toHaveBeenCalledWith(channelId);

      expect(messageController.redisService.saveKey).toHaveBeenCalledTimes(1);
      expect(messageController.redisService.saveKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:messages`,
        messages
      );
    });

    it('should call messagesService.getAllByChannelId ONLY when messages.length === 0', async () => {
      const { channelId } = mockRequest.query;

      messageController.messageService.getAllByChannelId = jest
        .fn()
        .mockResolvedValueOnce([]);

      try {
        await messageController.getChannelMessages(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        messageController.messageService.getAllByChannelId
      ).toHaveBeenCalledTimes(1);
      expect(
        messageController.messageService.getAllByChannelId
      ).toHaveBeenCalledWith(channelId);

      expect(messageController.redisService.saveKey).toHaveBeenCalledTimes(0);
    });
  });

  describe('createMessage', () => {
    it('should call channelService.getById, userService.getById, messageService.create, redisService.deleteKey when sucessfull channel and user query', async () => {
      const {
        channel: channelId,
        user: messageUserId,
      } = mockRequest.body.message;
      const { userId, username } = mockRequest.session;
      const mockChannel = { id: 62621 };
      const mockUser = { id: 114167 };
      const mockMessage = {
        channel: mockChannel,
        content: mockRequest.body.message.content,
        user: mockUser,
      };

      messageController.channelService.getById = jest
        .fn()
        .mockResolvedValueOnce(mockChannel);

      messageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(mockUser);

      messageController.messageService.create = jest
        .fn()
        .mockResolvedValueOnce({ user: {}, channel: {} });

      try {
        await messageController.createMessage(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(messageController.channelService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.channelService.getById).toHaveBeenCalledWith(
        channelId
      );

      expect(messageController.userService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.userService.getById).toHaveBeenCalledWith(
        messageUserId
      );

      expect(messageController.messageService.create).toHaveBeenCalledTimes(1);
      expect(messageController.messageService.create).toHaveBeenCalledWith(
        mockMessage
      );

      expect(messageController.redisService.deleteKey).toHaveBeenCalledTimes(1);
      expect(messageController.redisService.deleteKey).toHaveBeenCalledWith(
        `user:${userId}-${username}:messages`
      );
    });

    it('should call channelService.getById, userService.getById when query fails to find the channel in db', async () => {
      const {
        channel: channelId,
        user: messageUserId,
      } = mockRequest.body.message;
      const mockUser = { id: 114167 };

      messageController.userService.getById = jest
        .fn()
        .mockResolvedValueOnce(mockUser);

      try {
        await messageController.createMessage(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(messageController.channelService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.channelService.getById).toHaveBeenCalledWith(
        channelId
      );

      expect(messageController.userService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.userService.getById).toHaveBeenCalledWith(
        messageUserId
      );

      expect(messageController.messageService.create).toHaveBeenCalledTimes(0);
    });

    it('should call channelService.getById, userService.getById when query fails to find the user in db', async () => {
      const {
        channel: channelId,
        user: messageUserId,
      } = mockRequest.body.message;
      const mockChannel = { id: 62621 };

      messageController.channelService.getById = jest
        .fn()
        .mockResolvedValueOnce(mockChannel);

      try {
        await messageController.createMessage(
          mockRequest as any,
          mockResponse as any
        );
        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(messageController.channelService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.channelService.getById).toHaveBeenCalledWith(
        channelId
      );

      expect(messageController.userService.getById).toHaveBeenCalledTimes(1);
      expect(messageController.userService.getById).toHaveBeenCalledWith(
        messageUserId
      );

      expect(messageController.messageService.create).toHaveBeenCalledTimes(0);

      expect(messageController.redisService.deleteKey).toHaveBeenCalledTimes(0);
    });
  });
});
