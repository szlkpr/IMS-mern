//Inventory Items
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    retailPrice: {
        type: Number,
        required: true, // Price for retail customers
    },
    wholesalePrice: {
        type: Number,
        required: true, // Price for wholesale customers
    },
    wholesaleThreshold: {
        type: Number,
        required: true, // Minimum quantity for wholesale pricing
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    barcode: {
        type: String,
        unique: true,
        required: true,
    },
    status: {
        type: String,
        enum: ["in-stock", "out-of-stock"],
        default: "in-stock",
    },
}, { timestamps: true });

export const Product = mongoose.model("Product", productSchema);