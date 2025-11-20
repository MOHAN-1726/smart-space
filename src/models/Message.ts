import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  sender: mongoose.Types.ObjectId;
  class: mongoose.Types.ObjectId;
  content: string;
  parentMessage?: mongoose.Types.ObjectId;
  timestamp: Date;
}

const MessageSchema: Schema = new Schema({
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  class: { type: Schema.Types.ObjectId, ref: 'Class', required: true },
  content: { type: String, required: true },
  parentMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model<IMessage>('Message', MessageSchema);