import * as typeorm from 'typeorm';

import AuthenticationController from '../AuthenticationController';

describe('AuthenticationController', () => {
  describe('/auth/register POST', () => {
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

    it('should have path equal to /auth', () => {
      expect(authenticationController.path).toBe('/auth');
    });

    it('should have a router', () => {
      expect(authenticationController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(authenticationController.userRepository).toBeDefined();
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

    describe('When attempting to register a new user', () => {
      it('should call userRepository.create and userRepository.save methods', async () => {
        const newAuthenticationController = new AuthenticationController();

        (newAuthenticationController.userRepository as any) = {
          create: jest.fn().mockReturnThis(),
          save: jest.fn(),
        };

        await newAuthenticationController.registerUser(
          mockRequest as any,
          mockResponse as any
        );

        expect(
          newAuthenticationController.userRepository.create
        ).toHaveBeenCalled();
        expect(
          newAuthenticationController.userRepository.save
        ).toHaveBeenCalled();
      });

      it('should call res.status and res.json methods', () => {
        expect(mockResponse.status).toHaveBeenCalled();
        expect(mockResponse.json).toHaveBeenCalled();
      });
    });
  });
});
