
import { Request, Response } from 'express';
import Class from '../models/Class';

export const createClass = async (req: Request, res: Response) => {
  try {
    const { name, teacher } = req.body;
    const newClass = new Class({ name, teacher });
    await newClass.save();
    res.status(201).json(newClass);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getClasses = async (req: Request, res: Response) => {
  try {
    const classes = await Class.find().populate('teacher').populate('students');
    res.json(classes);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const addStudentToClass = async (req: Request, res: Response) => {
  try {
    const { classId, studentId } = req.body;
    const updatedClass = await Class.findByIdAndUpdate(classId, { $push: { students: studentId } }, { new: true });
    res.json(updatedClass);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
