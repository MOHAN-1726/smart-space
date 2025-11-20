
import { Router } from 'express';
import { createClass, getClasses, addStudentToClass } from '../controllers/class';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth, authorize(['teacher', 'admin']), createClass);
router.get('/', auth, getClasses);
router.post('/add-student', auth, authorize(['teacher', 'admin']), addStudentToClass);

export default router;
