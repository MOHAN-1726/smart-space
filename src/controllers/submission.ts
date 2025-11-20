
import { Request, Response } from 'express';
import Submission from '../models/Submission';

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const { assignment, student, file } = req.body;
    const newSubmission = new Submission({ assignment, student, file });
    await newSubmission.save();
    res.status(201).json(newSubmission);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getSubmissionsByAssignment = async (req: Request, res: Response) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await Submission.find({ assignment: assignmentId }).populate('student');
    res.json(submissions);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const gradeSubmission = async (req: Request, res: Response) => {
  try {
    const { submissionId, grade } = req.body;
    const updatedSubmission = await Submission.findByIdAndUpdate(submissionId, { grade }, { new: true });
    res.json(updatedSubmission);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
