import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Task } from "../models/task.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { validateTaskInput } from "../utils/validateTask.js";

const validateTaskId = (id) => {
  const isValid = mongoose.isObjectIdOrHexString(id);
  if (!isValid) throw new ApiError(400, "Invalid task ID");
};

const createTask = asyncHandler(async (req, res) => {
  const errors = validateTaskInput(req.body);
  if (errors.length > 0) {
    throw new ApiError(400, "Invalid task input", errors);
  }

  const { title, description, priority, status, dueDate } = req.body;
  const task = await Task.create({
    title,
    description,
    priority,
    status,
    dueDate,
    owner: req.user._id,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, task, "Task created Successfully"));
});

const getAllTasks = asyncHandler(async (req, res) => {
  const tasks = await Task.find({ owner: req.user._id }); //{owner:req.user._id} --> searches the tasks of the login user

  return res
    .status(200)
    .json(new ApiResponse(200, tasks, "Tasks fetched successfully!"));
});

const getTaskById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateTaskId(id);
  const task = await Task.findOne({
    _id: id,
    owner: req.user._id,
  });
  if (!task) throw new ApiError(404, "Task is not found");
  return res
    .status(200)
    .json(
      new ApiResponse(200, task, `Task by ID: ${id} is fetched successfully!`),
    );
});

const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateTaskId(id);

  const errors = validateTaskInput(req.body, { partial: true });
  if (errors.length > 0) {
    throw new ApiError(400, "Invalid task input", errors);
  }

  const { title, description, priority, status, dueDate } = req.body;
  const updateData = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (priority !== undefined) updateData.priority = priority;
  if (status !== undefined) updateData.status = status;
  if (dueDate !== undefined) updateData.dueDate = dueDate;

  if (Object.keys(updateData).length === 0) {
    throw new ApiError(400, "At least one field is required to update");
  }

  const task = await Task.findOneAndUpdate(
    {
      _id: id, //selects the requested task.
      owner: req.user._id, //ensures it belongs to the logged-in user.
    },
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!task) throw new ApiError(404, "Task not Found");

  return res.status(200).json(new ApiResponse(200, task, "Task is Updated!"));
});

const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  validateTaskId(id);
  const task = await Task.findOneAndDelete({
    _id: id,
    owner: req.user._id,
  });

  if (!task) throw new ApiError(404, "Task not found");

  return res
    .status(200)
    .json(new ApiResponse(200, task, "Task deleted successfully"));
});

export { createTask, getAllTasks, getTaskById, updateTask, deleteTask };
