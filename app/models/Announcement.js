import mongoose from "mongoose";

const AnnouncementSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  shop: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Announcement = mongoose.models.Announcement || mongoose.model("Announcement", AnnouncementSchema);

export default Announcement;
