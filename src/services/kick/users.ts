import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validateRequest } from '../../utils/validation';
import { KickUserSchema } from '../../types/kick';

export const createUserService = (app: Router) => {
  const router = Router();

  router.get('/:id', asyncHandler(async (req, res) => {
    const user = await req.app.get('userService').getUser(req.params.id);
    res.json({
      id: user.id,
      username: user.username,
      created_at: user.createdAt.toISOString()
    });
  }));

  router.put('/:id', 
    validateRequest(KickUserSchema),
    asyncHandler(async (req, res) => {
      const updatedUser = await req.app.get('userService').updateUser(
        req.params.id,
        req.body
      );
      res.json(updatedUser);
    })
  );

  router.delete('/:id', asyncHandler(async (req, res) => {
    await req.app.get('userService').deleteUser(req.params.id);
    res.status(204).end();
  }));

  app.use('/api/kick/users', router);
};