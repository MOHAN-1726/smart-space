
import { Schema, model } from 'mongoose';
import { AnnouncementDocument } from '../types';

const announcementSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  class: {
    type: Schema.Types.ObjectId,
    ref: 'Class',
  },
}, { timestamps: true });

export default model<AnnouncementDocument>('Announcement', announcementSchema);
