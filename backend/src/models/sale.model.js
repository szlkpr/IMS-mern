//Sales Record
import mongoose from "mongoose";

const soldProductsSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
});

const saleSchema = new mongoose.Schema({
    soldProducts: {
        type: [soldProductsSchema],
        required: true,
    },
    saleCost: {
        type: Number,
        required: true,
    },
    customerName: {
        type: String,
    },
    customerContact: {
        type: String,
    },
}, { timestamps: true });

export const Sale = mongoose.model("Sale", saleSchema);
