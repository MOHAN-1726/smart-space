import { Request, Response } from 'express';
import Assignment from '../models/Assignment';
import { v4 as uuidv4 } from 'uuid';

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const { title, description, class: classId, teacher, dueDate } = req.body;
    const newAssignment = new Assignment({ id: uuidv4(), title, description, class: classId, teacher, dueDate });
    await newAssignment.save();
    res.status(201).json(newAssignment);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getAssignmentsByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const assignments = await Assignment.find({ class: classId });
    res.json(assignments);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
