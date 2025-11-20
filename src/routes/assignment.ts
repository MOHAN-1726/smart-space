
import { Router } from 'express';
import { createAssignment, getAssignmentsByClass } from '../controllers/assignment';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth, authorize(['STAFF']), createAssignment);
router.get('/class/:classId', auth, getAssignmentsByClass);

export default router;
