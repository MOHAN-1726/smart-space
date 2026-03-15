
import { Router } from 'express';
import { createSubmission, getSubmissionsByAssignment, gradeSubmission } from '../controllers/submission';
import { auth, authorize } from '../middleware/auth';

const router = Router();

router.post('/', auth, authorize(['STUDENT']), createSubmission);
router.get('/assignment/:assignmentId', auth, getSubmissionsByAssignment);
router.post('/grade', auth, authorize(['STAFF']), gradeSubmission);

export default router;
