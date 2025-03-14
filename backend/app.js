import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connect from "./db/db.js";
import userRoutes from "./routes/user.routes.js"
import aiRoutes from './routes/ai.routes.js';
import projectRoutes from './routes/project.routes.js';
dotenv.config();

connect();

const app = express();
app.get("/", (req, res) => {
  res.send("Backend is running successfully!");
});

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/users',userRoutes);
app.use('/projects', projectRoutes);
app.use("/ai", aiRoutes)

export default app;
