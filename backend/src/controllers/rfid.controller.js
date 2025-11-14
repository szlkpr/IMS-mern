import RfidTag from "../models/rfidTag.model.js";
import { Product } from "../models/product.model.js";
import { Sale } from "../models/sale.model.js";
import WebSocketService from "../services/websocket.service.js";

export const handleScan = async (req, res) => {
    try {
        const { tagId: rawTagId, rfidUid, quantity = 1 } = req.body || {};
        const tagId = (rawTagId || rfidUid || "").trim();
        if (!tagId) {
            return res.status(400).json({ message: "tagId (or rfidUid) is required" });
        }
       const tag = await RfidTag.findOne({ tagId: tagId, status: "active" }).lean();
        if (!tag) {
            return res.status(404).json({ message: "Unknown or inactive tag" });
        }
        const product = await Product.findById(tag.productId);
        if (!product) {
            return res.status(404).json({ message: "Mapped product not found" });
        }
        
        if (product.stock < quantity) { 
            return res.status(409).json({ message: "Insufficient stock" });
        }

        const unitPrice = product.retailPrice;
        const totalPrice = unitPrice * quantity;

        const sale = new Sale({
            soldProducts: [{
                productId: product._id,
                quantity,
                unitPrice,
                totalPrice: totalPrice
            }],
            subtotal: totalPrice,
            discountType: "none",
            discountValue: 0,
            paymentMethod: "cash",
            paymentStatus: "paid",
            status: "completed",
            notes: `RFID sale via device ${req.header("x-device-id") || "unknown"} for tag ${tagId}`
        });
        await sale.save();
        
        product.stock -= quantity; 
        await product.save();

        // Notify real-time dashboards
        WebSocketService.broadcastSaleAlert({
            _id: sale._id,
            invoiceNumber: sale.invoiceNumber,
            totalAmount: sale.totalAmount, // This should be calculated by your model, or add it here
            soldProducts: sale.soldProducts,
            paymentStatus: sale.paymentStatus,
            paymentMethod: sale.paymentMethod,
            createdAt: sale.createdAt
        });

        return res.json({ ok: true, saleId: sale._id, invoiceNumber: sale.invoiceNumber });
    } catch (err) {
        console.error("RFID scan error:", err);
        return res.status(500).json({ message: "server_error" });
    }
};