import AuthenticationController from '.';

describe('AuthenticationController', () => {
  let authenticationController: AuthenticationController;

  beforeEach(() => {
    const mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    function MockUserService(this: any, mockModel: any) {
      this.userRepository = mockModel;
      this.getByEmail = jest.fn();
      this.getById = jest.fn();
      this.getByUsername = jest.fn();
      this.create = jest.fn();
    }
    authenticationController = new AuthenticationController(
      new (MockUserService as any)(mockUserModel)
    );
  });

  it('should be a module', () => {
    expect(authenticationController).toBeDefined();
  });

  describe('registerUser', () => {
    it('should call getByEmail, getByUsername method from UserService', async () => {
      const mockRequest = {
        body: {
          email: 'test@email.com',
          password: 'testpassword',
          username: 'testusername',
        },
      };
      const mockResponse = {
        status: jest.fn(),
        json: jest.fn(),
      };

      try {
        await authenticationController.registerUser(
          mockRequest as any,
          mockResponse as any
        );

        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        authenticationController.userService.getByEmail
      ).toHaveBeenCalledTimes(1);
      expect(
        authenticationController.userService.getByEmail
      ).toHaveBeenCalledWith(mockRequest.body.email);

      expect(
        authenticationController.userService.getByUsername
      ).toHaveBeenCalledTimes(1);
      expect(
        authenticationController.userService.getByUsername
      ).toHaveBeenCalledWith(mockRequest.body.username);

      expect(authenticationController.userService.create).toHaveBeenCalledTimes(
        1
      );
      expect(authenticationController.userService.create).toHaveBeenCalledWith(
        mockRequest.body
      );
    });
  });

  describe('loginUser', () => {
    it('should call getByEmail method from the UserService', async () => {
      const mockRequest = {
        body: {
          email: 'test@email.com',
        },
      };
      const mockResponse = {
        status: jest.fn(),
        json: jest.fn(),
      };

      try {
        await authenticationController.loginUser(
          mockRequest as any,
          mockResponse as any
        );

        // eslint-disable-next-line no-empty
      } catch (e) {}

      expect(
        authenticationController.userService.getByEmail
      ).toHaveBeenCalledTimes(1);
      expect(
        authenticationController.userService.getByEmail
      ).toHaveBeenCalledWith(mockRequest.body.email);
    });
  });

  describe('logoutUser', () => {
    it('should call the destroy from the session object on the request object', () => {
      const mockRequest = {
        session: {
          destroy: jest.fn(),
        },
      };
      const mockResponse = {
        status: jest.fn(),
        json: jest.fn(),
      };

      authenticationController.logoutUser(
        mockRequest as any,
        mockResponse as any
      );

      expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
