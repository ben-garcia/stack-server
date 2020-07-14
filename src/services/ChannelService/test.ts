import ChannelService from '.';

describe('ChannelService', () => {
  let channelService: ChannelService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      findOne: jest.fn(),
      query: jest.fn(),
      update: jest.fn(),
      save: jest.fn(),
    };
    channelService = new ChannelService(mockModel);
  });

  it('should be a module', () => {
    expect(channelService).toBeDefined();
  });

  describe('getChannelsByIds', () => {
    it('should call the query method from the model', () => {
      channelService.getChannelsByIds('1', '2');
      expect(mockModel.query).toHaveBeenCalledTimes(1);
    });
  });
  describe('getMembersByChannelId', () => {
    it('should call the findOne method from the model', () => {
      channelService.getMembersByChannelId(1);
      expect(mockModel.findOne).toHaveBeenCalledTimes(1);
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

      channelService.create(channel);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.save).toHaveBeenCalledTimes(1);
    });

    describe('update', () => {
      it('should call the update method from the model', () => {
        channelService.update(1, { name: 'name change' });
        expect(mockModel.update).toHaveBeenCalledTimes(1);
      });
    });
  });
});
