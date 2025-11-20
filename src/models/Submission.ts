
import { Schema, model } from 'mongoose';
import { SubmissionDocument } from '../types';

const submissionSchema = new Schema({
  assignment: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  grade: {
    type: Number,
  },
  file: {
    type: String,
    required: true,
  }
}, { timestamps: true });

export default model<SubmissionDocument>('Submission', submissionSchema);
