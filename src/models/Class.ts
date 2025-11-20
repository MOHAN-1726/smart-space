
import { Schema, model } from 'mongoose';
import { ClassDocument } from '../types';

const classSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  students: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

export default model<ClassDocument>('Class', classSchema);
