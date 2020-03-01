import * as typeorm from 'typeorm';

import { ChannelController } from '..';

describe('ChannelController', () => {
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
  const channelController = new ChannelController();

  describe('verify member variables', () => {
    it('should have path equal to /workspaces', () => {
      expect(channelController.path).toBe('/channels');
    });

    it('should have a router', () => {
      expect(channelController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(channelController.channelRepository).toBeDefined();
    });
  });

  describe('/channels POST', () => {
    const mockRequest = {
      body: {
        channel: {},
      },
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it('should call validateSchema method', async () => {
      channelController.schema.validateAsync = jest.fn();

      await channelController.createChannel(
        mockRequest as any,
        mockResponse as any
      );
      expect(channelController.schema.validateAsync).toHaveBeenCalled();
      expect(channelController.schema.validateAsync).toHaveBeenCalledWith(
        mockRequest.body.channel
      );
    });
  });
});
