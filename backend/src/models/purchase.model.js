// Purchase Record
import mongoose from "mongoose";

const purchasedProducts = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    quantity: {
        type: Number,
        required: true,
    },
});

const purchaseSchema = new mongoose.Schema({
    purchasedProducts: {
        type: [purchasedProducts],
    },
    saleCost: {
        type: Number,
        required: true,
    },
    vendorCompanyName: {
        type: String,
        required: true,
    },
    vendorContact: {
        type: String,
        required: true,
    },
    purchaseDate: {
        type: Date,
        required: true,
    },
    shelfLife: {
        type: String,
    },
});

const Purchase = mongoose.model("Purchase", purchaseSchema);
export default Purchase;