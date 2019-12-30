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

    describe('When attempting to register a new user', () => {
      it('should call validateAsync with req.body', async () => {
        authenticationController.schema.validateAsync = jest.fn();

        await authenticationController.registerUser(
          mockRequest as any,
          mockResponse as any
        );

        expect(
          authenticationController.schema.validateAsync
        ).toHaveBeenCalled();
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
  });
});
