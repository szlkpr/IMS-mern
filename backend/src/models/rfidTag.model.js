import mongoose from "mongoose";

const rfidTagSchema = new mongoose.Schema({
    tagId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index: true,
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    status: {
        type: String,
        enum: ["active", "inactive", "assigned"],
        default: "active",
    },
    assignedAt: {
        type: Date,
    },
    lastSeenAt: {
        type: Date,
    },
}, { timestamps: true });

const RfidTag = mongoose.model("RfidTag", rfidTagSchema);

export default RfidTag;