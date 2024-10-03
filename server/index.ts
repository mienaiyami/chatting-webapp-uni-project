import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import config from "./config/config";
import connectDB from "./config/db";
import routes from "./routes/index";
import { app, server } from "./socket";
const PORT = config.PORT;

app.use(cookieParser());
app.use(express.json());
app.use(
    cors({
        //! replace later
        origin: "*",
        credentials: true,
    })
);

app.use((req, res, next) => {
    console.info(`${req.method} ${req.url}`);
    next();
});
app.get("/", (req, res) => {
    res.send("Server Working.");
});
app.use("/api", routes);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
