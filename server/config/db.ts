import mongoose from "mongoose";
import config from "./config";

const connect = async () => {
    try {
        console.log("Connecting to DB...");
        await mongoose.connect(config.DB_URL);
        console.log("Connected to DB");
    } catch (err) {
        console.log("DB connection failed.", err);
    }
};

export default connect;
