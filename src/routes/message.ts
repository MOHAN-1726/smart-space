import { Router } from 'express';
import { getMessagesByClass, createMessage } from '../controllers/message';

const router = Router();

router.get('/:classId', getMessagesByClass);
router.post('/', createMessage);

export default router;
