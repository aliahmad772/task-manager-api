import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    userAgent: {
      type: String,
      default: 'Unknown Device',
    },
    ip: {
      type: String,
      default: 'Unknown IP',
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL index: automatically deletes document when expiresAt is reached
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
