import * as typeorm from 'typeorm';

import { DirectMessageController } from '..';

describe('DirectMessageController', () => {
  // create the mock for 'getRepository' that gets called
  jest.spyOn(typeorm, 'getRepository').mockImplementation(
    () =>
      ({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      } as any)
  );
  const directMessageController = new DirectMessageController();

  describe('verify member variables', () => {
    it('should have path equal to /direct-messages', () => {
      expect(directMessageController.path).toBe('/direct-messages');
    });

    it('should have a router', () => {
      expect(directMessageController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(directMessageController.directMessageRepository).toBeDefined();
    });
  });

  describe('/direct-messages POST', () => {
    const mockRequest = {
      body: {
        message: {},
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it('should call validateSchema method', async () => {
      directMessageController.schema.validateAsync = jest.fn();

      await directMessageController.createDirectMessage(
        mockRequest as any,
        mockResponse as any
      );
      expect(directMessageController.schema.validateAsync).toHaveBeenCalled();
      expect(directMessageController.schema.validateAsync).toHaveBeenCalledWith(
        mockRequest.body.message
      );
    });
  });
});
