import config from "./config/config";
import connectDB from "./config/db";
import routes from "./routes/index";
import { app, server } from "./socket/socket";
const PORT = config.PORT;

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
