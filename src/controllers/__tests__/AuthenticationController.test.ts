import * as typeorm from 'typeorm';

import AuthenticationController from '../AuthenticationController';

describe('AuthenticationController', () => {
  // create the mock for 'getRepository' that gets called
  // by the authenticationController constructor.
  jest.spyOn(typeorm, 'getRepository').mockImplementation(
    () =>
      ({
        create: jest.fn(),
        save: jest.fn(),
      } as any)
  );
  const authenticationController = new AuthenticationController();

  describe('verify member variables', () => {
    it('should have path equal to /auth', () => {
      expect(authenticationController.path).toBe('/auth');
    });

    it('should have a router', () => {
      expect(authenticationController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(authenticationController.userRepository).toBeDefined();
    });
  });
  describe('/auth/register POST', () => {
    const mockRequest = {
      body: {
        email: 'test@email.com',
        username: 'username',
        password: 'password',
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it('should call validateAsync with req.body', async () => {
      authenticationController.schema.validateAsync = jest.fn();

      await authenticationController.registerUser(
        mockRequest as any,
        mockResponse as any
      );

      expect(authenticationController.schema.validateAsync).toHaveBeenCalled();
      expect(
        authenticationController.schema.validateAsync
      ).toHaveBeenCalledWith(mockRequest.body);
    });

    it('should make sure registerUser method is called properlly', async () => {
      authenticationController.registerUser = jest.fn();
      await authenticationController.registerUser(
        mockRequest as any,
        mockResponse as any
      );

      expect(authenticationController.registerUser).toHaveBeenCalled();
      expect(authenticationController.registerUser).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      );
    });
  });
  describe('/auth/login POST', () => {
    const mockRequest = {
      body: {
        email: 'test2@email.com',
        password: 'anotherpassword',
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    authenticationController.loginUser = jest.fn();

    it('should call loginUser method with req.body', () => {
      authenticationController.loginUser(
        mockRequest as any,
        mockResponse as any
      );

      expect(authenticationController.loginUser).toHaveBeenCalled();
      expect(authenticationController.loginUser).toHaveBeenCalledWith(
        mockRequest,
        mockResponse
      );
    });
  });
});
