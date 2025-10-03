// Enhanced PDF Invoice Generator with Multi-item Support and Discounts
import PDFDocument from "pdfkit";

export const generatePDFInvoice = async (sale) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ 
                size: 'A4', 
                margin: 50,
                info: {
                    Title: `Invoice ${sale.invoiceNumber || sale._id}`,
                    Author: 'Inventory Management System',
                    Subject: 'Sales Invoice',
                    CreationDate: new Date()
                }
            });
            let buffers = [];

            doc.on("data", chunk => buffers.push(chunk));
            doc.on("end", () => {
                resolve(Buffer.concat(buffers));
            });
            doc.on("error", reject);

            // Company Header
            doc.fontSize(24)
               .font('Helvetica-Bold')
               .text('INVENTORY SYSTEM', 50, 50)
               .fontSize(12)
               .font('Helvetica')
               .text('Complete Inventory Management Solution', 50, 80)
               .text('Phone: +91-XXXX-XXXX | Email: info@inventory.com', 50, 95);

            // Invoice Header
            doc.fontSize(20)
               .font('Helvetica-Bold')
               .text('INVOICE', 400, 50)
               .fontSize(12)
               .font('Helvetica')
               .text(`Invoice #: ${sale.invoiceNumber || sale._id.slice(-8)}`, 400, 80)
               .text(`Date: ${new Date(sale.createdAt).toLocaleDateString('en-IN')}`, 400, 95)
               .text(`Status: ${sale.paymentStatus?.toUpperCase() || 'PAID'}`, 400, 110);

            // Bill To Section
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('BILL TO:', 50, 150)
               .fontSize(12)
               .font('Helvetica')
               .text(sale.customerName || 'Walk-in Customer', 50, 170)
               .text(sale.customerContact || 'N/A', 50, 185);
            
            if (sale.customerEmail) {
                doc.text(sale.customerEmail, 50, 200);
            }
            if (sale.customerAddress) {
                doc.text(sale.customerAddress, 50, sale.customerEmail ? 215 : 200, { 
                    width: 200, 
                    align: 'left' 
                });
            }

            // Payment Info
            doc.fontSize(14)
               .font('Helvetica-Bold')
               .text('PAYMENT INFO:', 350, 150)
               .fontSize(12)
               .font('Helvetica')
               .text(`Method: ${sale.paymentMethod?.toUpperCase() || 'CASH'}`, 350, 170)
               .text(`Status: ${sale.paymentStatus?.toUpperCase() || 'PAID'}`, 350, 185);

            // Items Table Header
            let currentY = 260;
            doc.rect(50, currentY, 495, 25).fill('#f0f0f0');
            
            doc.fillColor('#000')
               .fontSize(10)
               .font('Helvetica-Bold')
               .text('ITEM', 60, currentY + 8)
               .text('QTY', 250, currentY + 8)
               .text('UNIT PRICE', 310, currentY + 8)
               .text('AMOUNT', 450, currentY + 8);

            currentY += 25;
            
            // Items Table Content
            let subtotal = 0;
            doc.font('Helvetica')
               .fontSize(9);
               
            sale.soldProducts.forEach((item, index) => {
                const productName = item.productId?.name || 'Product Name';
                const brand = item.productId?.brand;
                const quantity = item.quantity || 1;
                const unitPrice = item.unitPrice || item.price || 0;
                const totalPrice = item.totalPrice || (quantity * unitPrice);
                
                subtotal += totalPrice;
                
                // Alternate row coloring
                if (index % 2 === 1) {
                    doc.rect(50, currentY, 495, 20).fill('#fafafa');
                    doc.fillColor('#000');
                }
                
                // Product name and brand
                doc.text(productName, 60, currentY + 6, { width: 180, ellipsis: true });
                if (brand) {
                    doc.text(`(${brand})`, 60, currentY + 16, { width: 180, ellipsis: true });
                }
                
                // Quantity
                doc.text(quantity.toString(), 250, currentY + 8, { width: 50, align: 'center' });
                
                // Unit Price
                doc.text(`₹${unitPrice.toFixed(2)}`, 310, currentY + 8, { width: 80, align: 'right' });
                
                // Total Price
                doc.text(`₹${totalPrice.toFixed(2)}`, 450, currentY + 8, { width: 85, align: 'right' });
                
                currentY += 25;
            });

            // Totals Section
            currentY += 20;
            
            // Subtotal
            doc.fontSize(10)
               .text('Subtotal:', 400, currentY)
               .text(`₹${(sale.subtotal || subtotal).toFixed(2)}`, 450, currentY, { width: 85, align: 'right' });
            
            currentY += 15;
            
            // Discount
            if (sale.discountAmount && sale.discountAmount > 0) {
                let discountText = 'Discount:';
                if (sale.discountType === 'percentage') {
                    discountText = `Discount (${sale.discountValue}%):`;
                } else if (sale.discountType === 'fixed') {
                    discountText = `Discount (₹${sale.discountValue}):`;
                }
                
                doc.text(discountText, 400, currentY)
                   .text(`-₹${sale.discountAmount.toFixed(2)}`, 450, currentY, { width: 85, align: 'right' });
                
                currentY += 15;
            }
            
            // Tax (if applicable)
            if (sale.taxAmount && sale.taxAmount > 0) {
                doc.text('Tax:', 400, currentY)
                   .text(`₹${sale.taxAmount.toFixed(2)}`, 450, currentY, { width: 85, align: 'right' });
                
                currentY += 15;
            }
            
            // Total
            doc.rect(400, currentY, 135, 25).fill('#e0e0e0');
            doc.fillColor('#000')
               .fontSize(12)
               .font('Helvetica-Bold')
               .text('TOTAL:', 410, currentY + 8)
               .text(`₹${(sale.totalAmount || sale.saleCost || subtotal).toFixed(2)}`, 450, currentY + 8, { 
                   width: 85, 
                   align: 'right' 
               });

            // Notes section
            if (sale.notes) {
                currentY += 50;
                doc.fontSize(10)
                   .font('Helvetica-Bold')
                   .text('Notes:', 50, currentY)
                   .font('Helvetica')
                   .text(sale.notes, 50, currentY + 15, { width: 495 });
            }

            // Footer
            const footerY = 720;
            doc.fontSize(8)
               .font('Helvetica')
               .text('Thank you for your business!', 50, footerY, { align: 'center', width: 495 })
               .text(`Generated on ${new Date().toLocaleString('en-IN')}`, 50, footerY + 15, { 
                   align: 'center', 
                   width: 495 
               });

            // Add page border
            doc.rect(30, 30, 535, 762).stroke();

            doc.end();
            
        } catch (error) {
            reject(error);
        }
    });
};
