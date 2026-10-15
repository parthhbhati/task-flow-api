import { Router } from "express";
import { createTask, deleteTask, getAllTasks, getTaskById, updateTask } from "../controllers/task.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router()


router.route('/').post(verifyJWT,createTask).get(verifyJWT,getAllTasks);
router.route('/:id').get(verifyJWT,getTaskById).patch(verifyJWT,updateTask).delete(verifyJWT,deleteTask);


export default router;
