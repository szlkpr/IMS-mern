// filepath: d:\inventory\backend\src\utils\pdfGenerator.js
import PDFDocument from "pdfkit";

export const generatePDFInvoice = async (sale) => {
    const doc = new PDFDocument();
    let buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {});

    // Add content to the PDF
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Sale ID: ${sale._id}`);
    doc.text(`Customer Name: ${sale.customerName}`);
    doc.text(`Customer Contact: ${sale.customerContact}`);
    doc.moveDown();

    doc.text("Products:");
    sale.soldProducts.forEach((item) => {
        doc.text(`- ${item.productId.name}: ${item.quantity} x ${item.price}`);
    });

    doc.moveDown();
    doc.text(`Total Cost: ${sale.saleCost}`, { align: "right" });

    doc.end();

    return Buffer.concat(buffers);
};