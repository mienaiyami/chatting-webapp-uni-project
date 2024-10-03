import { z } from "zod";
import dotenv from "dotenv";
dotenv.config();

const configSchema = z.object({
    PORT: z.string().default("6969"),
    DB_URL: z.string(),
    JWT_SECRET: z.string(),
});

const config = configSchema.parse(process.env);

export default config;
export const PORT = config.PORT;
export const DB_URL = config.DB_URL;
export const JWT_SECRET = config.JWT_SECRET;
