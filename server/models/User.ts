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
                return this.password === cPass;
                // return await bcrypt.compare(cPass, this.password);
            },
        },
    }
);

//todo
// userSchema.pre("save", async (next) => {
//     if (!this.isModified("password")) next();
//
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// });

export default mongoose.model("User", userSchema);
