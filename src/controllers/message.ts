import { Request, Response } from 'express';
import Message from '../models/Message';

export const getMessagesByClass = async (req: Request, res: Response) => {
  try {
    const { classId } = req.params;
    const messages = await Message.find({ class: classId }).populate('sender', 'name');
    res.json(messages);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

export const createMessage = async (req: Request, res: Response) => {
  try {
    const { sender, class: classId, content, parentMessage } = req.body;
    const newMessage = new Message({ sender, class: classId, content, parentMessage });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};
