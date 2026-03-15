
import { Request, Response } from 'express';
import Note from '../models/Note';

export const createNote = async (req: Request, res: Response) => {
  try {
    const { title, class: classId, teacher, file } = req.body;
    const newNote = new Note({ title, class: classId, teacher, file });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const getNotesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const notes = await Note.find({ class: classId });
    res.json(notes);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
