import MessageService from '.';

describe('MessageService', () => {
  let messageService: MessageService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    messageService = new MessageService(mockModel);
  });

  it('should be a module', () => {
    expect(messageService).toBeDefined();
  });

  describe('getAllByChannelId', () => {
    it('should call findOne method from the model', () => {
      const params = {
        order: { createdAt: 'ASC' },
        relations: ['user'],
        where: { channel: 1 },
      };

      messageService.getAllByChannelId(1);
      expect(mockModel.find).toHaveBeenCalledTimes(1);
      expect(mockModel.find).toHaveBeenCalledWith(params);
    });
  });

  describe('create', () => {
    it('should call the create and save methods from the model', () => {
      const user = {
        id: 1,
        username: 'test',
        email: 'test@test.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const workspace = {
        id: 1,
        name: 'test',
        owner: user,
        teammates: [user],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const channel = {
        name: 'channel 1',
        description: 'test channel',
        private: true,
        workspace,
        members: [user],
      };
      const message = {
        channel,
        content: 'this is content',
        user,
      };

      messageService.create(message);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.create).toHaveBeenCalledWith(message);
      expect(mockModel.save).toHaveBeenCalledTimes(1);
    });
  });
});
