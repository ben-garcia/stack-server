import * as typeorm from 'typeorm';

import { MessageController } from '..';

describe('MessageController', () => {
  // create the mock for 'getRepository' that gets called
  // by the authenticationController constructor.
  jest.spyOn(typeorm, 'getRepository').mockImplementation(
    () =>
      ({
        findOne: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      } as any)
  );
  const messageController = new MessageController();

  describe('verify member variables', () => {
    it('should have path equal to /messages', () => {
      expect(messageController.path).toBe('/messages');
    });

    it('should have a router', () => {
      expect(messageController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(messageController.messageRepository).toBeDefined();
    });
  });

  describe('/messages POST', () => {
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
      messageController.schema.validateAsync = jest.fn();

      await messageController.createMessage(
        mockRequest as any,
        mockResponse as any
      );
      expect(messageController.schema.validateAsync).toHaveBeenCalled();
      expect(messageController.schema.validateAsync).toHaveBeenCalledWith(
        mockRequest.body.message
      );
    });
  });
});
