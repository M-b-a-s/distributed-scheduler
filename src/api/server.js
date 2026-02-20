import app from "./app";
import dotenv from "dotenv";

// configure dotenv
dotenv.config();
const port = process.env.PORT || 8080;

console.log('Starting server...');

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});