import express from "express";
import cors from "cors";

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

export default app;