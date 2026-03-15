
import { Router } from 'express';
import { createClass, getClasses, addStudentToClass } from '../controllers/class';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth, authorize(['STAFF', 'ADMIN']), createClass);
router.get('/', auth, getClasses);
router.post('/add-student', auth, authorize(['STAFF', 'ADMIN']), addStudentToClass);

export default router;
