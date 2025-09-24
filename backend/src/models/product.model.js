//Inventory Items
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
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
        required: true
    },
    barcode: {
        type: String,
        unique: true,
        sparse: true // Allows multiple products to not have a barcode
    },
    status: {
        type: String,
        enum: ["in-stock", "out-of-stock"],
        default: "in-stock",
    },
    isArchived: {
        type: Boolean,
        default: false,
    },
    
    // Optional Brand information
    brand: {
        type: String,
        trim: true,
        default: ''
    },
    
    // Optional Vehicle Variant compatibility (comma-separated)
    variant: {
        type: String,
        trim: true,
        default: '' // e.g., "Honda City, Toyota Corolla"
    },
    
    // Optional Compatibility information
    compatibility: {
        type: String,
        trim: true,
        default: '' // e.g., "Universal, Perfect Fit, Easy Installation"
    },
    
    // Low stock threshold for alerts
    lowStockThreshold: {
        type: Number,
        default: 5 // Alert when stock falls below this number
    },
    
    // Buying/cost price for profit calculations
    buyingPrice: {
        type: Number,
        default: 0
    },
}, { timestamps: true });

productSchema.pre("save", function (next) {
    if (this.isModified("stock")) {
        this.status = this.stock > 0 ? "in-stock" : "out-of-stock";
    }
    next();
});

productSchema.plugin(mongooseAggregatePaginate);

export const Product = mongoose.model("Product", productSchema);