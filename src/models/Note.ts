
import { Schema, model } from 'mongoose';
import { NoteDocument } from '../types';

const noteSchema = new Schema({
  title: {
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
  file: {
    type: String,
    required: true,
  },
}, { timestamps: true });

export default model<NoteDocument>('Note', noteSchema);
