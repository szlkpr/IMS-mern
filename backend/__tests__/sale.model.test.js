import { Sale } from '../src/models/sale.model.js';
import mongoose from 'mongoose';

describe('Sale model pre-save calculations', () => {
	it('calculates subtotal, discounts, and totals correctly (percentage)', async () => {
		const sale = await Sale.create({
			soldProducts: [
				{ productId: new mongoose.Types.ObjectId(), quantity: 2, unitPrice: 100, totalPrice: 200 },
				{ productId: new mongoose.Types.ObjectId(), quantity: 1, unitPrice: 50, totalPrice: 50 },
			],
			subtotal: 0,
			discountType: 'percentage',
			discountValue: 10,
		});

		expect(sale.subtotal).toBe(250);
		expect(sale.discountAmount).toBe(25);
		expect(sale.totalAmount).toBe(225);
		expect(sale.saleCost).toBe(225);
		const savings = sale.getSavings();
		expect(savings.discountAmount).toBe(25);
		expect(Math.round(savings.discountPercentage)).toBe(10);
		expect(sale.invoiceNumber).toMatch(/^INV-\d{4}-\d{6}$/);
	});

	it('caps fixed discount at subtotal', async () => {
		const sale = await Sale.create({
			soldProducts: [
				{ productId: new mongoose.Types.ObjectId(), quantity: 1, unitPrice: 30, totalPrice: 30 },
			],
			subtotal: 0,
			discountType: 'fixed',
			discountValue: 100,
		});

		expect(sale.subtotal).toBe(30);
		expect(sale.discountAmount).toBe(30);
		expect(sale.totalAmount).toBe(0);
	});
});


