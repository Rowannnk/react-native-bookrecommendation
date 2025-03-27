import express from "express";
import "dotenv/config"; // use this package for PORT from env
import authRoutes from "./routes/authRoutes.js";
import { connectDB } from "./lib/db.js";
import bookRoutes from "./routes/bookRoutes.js";
import cors from "cors";

const app = express();

const PORT = process.env.PORT || 3000;

console.log({ PORT });

app.use(express.json()); // this allow us to access request from body , it is like middleware
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("api/books", bookRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
