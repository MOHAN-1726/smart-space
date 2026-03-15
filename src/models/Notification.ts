
import { Schema, model } from 'mongoose';
import { NotificationDocument } from '../types';

const notificationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export default model<NotificationDocument>('Notification', notificationSchema);
