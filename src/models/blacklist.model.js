import mongoose from 'mongoose';

const blacklistSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB TTL index: automatically removes token when it naturally expires
      index: { expireAfterSeconds: 0 },
    },
  },
  {
    timestamps: true,
  }
);

const Blacklist = mongoose.model('Blacklist', blacklistSchema);

export default Blacklist;
