import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        avatarUrl: {
            type: String,
            default: "",
        },
        lastSeen: {
            type: Date,
        },
    },
    {
        timestamps: true,
        methods: {
            comparePassword: async function (cPass) {
                // return this.password === cPass;
                return await bcrypt.compare(cPass, this.password);
            },
        },
    }
);
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});
export default mongoose.model("User", userSchema);
