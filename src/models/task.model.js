import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    owner:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: [1,"Title cannot be empty"],
      validate: {
        validator: (value) => value.trim().length > 0,
        message: "Title cannot contain only whitespace",
      }
    },
    description: {
      type: String,
      default:""
    },
    priority: {
      type: String,
      enum: ["low","medium","high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["pending","in_progress","completed"],
      default: "pending"
    },
    dueDate: {
      type: Date,
    },
  },
  { timestamps: true },
);

export const Task = mongoose.model("Task", taskSchema);
