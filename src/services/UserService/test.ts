import UserService from '.';

describe('UserService', () => {
  let userService: UserService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    userService = new UserService(mockModel);
  });

  it('should be a module', () => {
    expect(userService).toBeDefined();
  });

  describe('getByEmail', () => {
    it('should call the findOne method from the model', () => {
      userService.getByEmail('test');
      expect(mockModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should call the findOne method from the model', () => {
      userService.getById(1);
      expect(mockModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('getByUsername', () => {
    it('should call the findOne method from the model', () => {
      userService.getByUsername('test');
      expect(mockModel.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should call the create and save methods from the model', () => {
      const user = {
        username: 'test',
        password: 'test123',
        email: 'test@test.com',
      };
      userService.create(user);
      expect(mockModel.create).toHaveBeenCalledTimes(1);
      expect(mockModel.create).toHaveBeenCalledWith(user);
      expect(mockModel.save).toHaveBeenCalledTimes(1);
    });
  });
});
