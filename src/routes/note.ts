
import { Router } from 'express';
import { createNote, getNotesByClass } from '../controllers/note';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth, authorize(['STAFF']), createNote);
router.get('/class/:classId', auth, getNotesByClass);

export default router;
