import mongoose, { model, Schema } from "mongoose";

mongoose.connect(
  "mongodb+srv://james:james123@cluster0.hqs2m.mongodb.net/braini"
);

const userSchema = new Schema({
  username: { type: String, unique: true },
  password: String,
});

export const userModel = model("User", userSchema);

const contentSchema = new Schema({
  title: String,
  link: String,
  type: String,
  tags: [{ type: mongoose.Types.ObjectId, ref: "Tag" }],
  userId: { type: mongoose.Types.ObjectId, ref: "User", required: true },
});

export const contentModel = model("Content", contentSchema);

const LinkSchema = new Schema({
  hash: String,
  userId: {
    type: mongoose.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
});

export const LinkModel = model("Links", LinkSchema);