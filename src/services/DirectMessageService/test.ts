import DirectMessageService from '.';

describe('DirectMessageService', () => {
  let directMessageService: DirectMessageService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };
    directMessageService = new DirectMessageService(mockModel);
  });

  it('should be a module', () => {
    expect(directMessageService).toBeDefined();
  });

  describe('getByIds', () => {
    it('should call find method from the model', () => {
      const params = {
        order: { createdAt: 'ASC' },
        relations: ['user'],
        where: [
          { user: 1, workspaceId: 2 },
          { user: 3, workspaceId: 2 },
        ],
      };

      directMessageService.getByIds(1, 2, 3);
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
      const directMessage = {
        content: 'this is content',
        workspaceId: 1,
        user,
      };

      directMessageService.create(directMessage);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.create).toHaveBeenCalledWith(directMessage);
      expect(mockModel.save).toHaveBeenCalledTimes(1);
    });
  });
});
