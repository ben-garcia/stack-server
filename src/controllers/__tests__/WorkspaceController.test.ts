import * as typeorm from 'typeorm';

import { WorkspaceController } from '..';

describe('WorkspaceController', () => {
  // create the mock for 'getRepository' that gets called
  // by the authenticationController constructor.
  jest.spyOn(typeorm, 'getRepository').mockImplementation(
    () =>
      ({
        find: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
      } as any)
  );
  const workspaceController = new WorkspaceController();

  describe('verify member variables', () => {
    it('should have path equal to /workspaces', () => {
      expect(workspaceController.path).toBe('/workspaces');
    });

    it('should have a router', () => {
      expect(workspaceController.router).toBeDefined();
    });

    it('should have a userRepository', () => {
      expect(workspaceController.workspaceRepository).toBeDefined();
    });
  });

  describe('/workspaces POST', () => {
    const mockRequest = {
      body: {},
    };
    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    it('should call validateSchema method', async () => {
      workspaceController.schema.validateAsync = jest.fn();

      await workspaceController.createWorkspace(
        mockRequest as any,
        mockResponse as any
      );
      expect(workspaceController.schema.validateAsync).toHaveBeenCalled();
      expect(workspaceController.schema.validateAsync).toHaveBeenCalledWith(
        mockRequest.body
      );
    });
  });
});
