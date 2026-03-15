
import { Schema, model } from 'mongoose';
import { TimetableDocument } from '../types';

const timetableSchema = new Schema({
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true,
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default model<TimetableDocument>('Timetable', timetableSchema);
