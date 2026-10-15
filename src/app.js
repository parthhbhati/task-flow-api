import express from "express";
import { errorHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import taskRouter from "./routes/task.routes.js";
import userRouter from "./routes/user.routes.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));

app.use(express.json());

app.use(express.urlencoded({
    extended: true,
    limit: "16kb",
}));

app.use(express.static("public"));
app.use(cookieParser());

app.get("/api/v1/health", (req, res) => {
    res.status(200).json({
        status: "success",
        message: "TaskFlow API is running",
    });
});

app.use("/api/v1/tasks", taskRouter);
app.use("/api/v1/users", userRouter);

app.use(errorHandler);

export { app };
