import express from "express";
import cors from "cors";
import errorHandler, { notFoundHandler } from "./middlewares/errorHandler.js";

const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// cors middleware
app.use(cors({
    origin: "http://localhost:3000",
    credentials: true,
}))

// Sample route
app.get("/", (req, res) => {
    res.send("Hello from the Distributed Scheduler API!");
});

// 404 handler for unknown routes (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export default app;