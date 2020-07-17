import RedisService from '.';

describe('RedisService', () => {
  let redisService: RedisService;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      del: jest.fn(),
      setex: jest.fn(),
    };
    redisService = new RedisService(mockModel);
  });

  it('should be a module', () => {
    expect(redisService).toBeDefined();
  });

  describe('deleteKey', () => {
    it('should call the del method from the model', () => {
      redisService.deleteKey('test');
      expect(mockModel.del).toHaveBeenCalledTimes(1);
      expect(mockModel.del).toHaveBeenCalledWith('test');
    });
  });

  describe('saveKey', () => {
    it('should call the setex method from the model', () => {
      const entity = [
        {
          id: 1,
          username: 'username',
        },
      ];

      redisService.saveKey('key', entity);
      expect(mockModel.setex).toHaveBeenCalledTimes(1);
      expect(mockModel.setex).toHaveBeenCalledWith(
        'key',
        1800,
        JSON.stringify(entity)
      );
    });
  });
});
