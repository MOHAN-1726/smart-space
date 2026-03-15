
import { Schema, model } from 'mongoose';
import { AttendanceDocument } from '../types';

const attendanceSchema = new Schema({
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  present: {
    type: Boolean,
    required: true,
  },
}, { timestamps: true });

export default model<AttendanceDocument>('Attendance', attendanceSchema);
