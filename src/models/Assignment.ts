
import { Schema, model } from 'mongoose';
import { AssignmentDocument } from '../types';

const assignmentSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
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
  dueDate: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

export default model<AssignmentDocument>('Assignment', assignmentSchema);
