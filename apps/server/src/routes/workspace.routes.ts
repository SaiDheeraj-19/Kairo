import { Router } from 'express';
import { WorkspaceController } from '../controllers/workspace.controller';

const router = Router();

router.get('/', WorkspaceController.list);
router.post('/', WorkspaceController.create);
router.delete('/:id', WorkspaceController.delete);
router.post('/:id/exec', WorkspaceController.execute);

export default router;
