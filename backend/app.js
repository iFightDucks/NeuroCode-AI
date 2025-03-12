import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connect from "./db/db.js";
import userRoutes from "./routes/user.routes.js"
dotenv.config();

connect();

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use('/users',userRoutes);

export default app;