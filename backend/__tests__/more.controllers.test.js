import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Product } from '../src/models/product.model.js';

describe('Additional controller coverage', () => {
	let token;

	beforeEach(async () => {
		await User.create({
			name: 'Cov Admin',
			email: 'cov@example.com',
			password: 'Password123!',
			role: 'admin',
		});
		const res = await request(app)
			.post('/api/v1/users/login')
			.send({ email: 'cov@example.com', password: 'Password123!' });
		token = res.body.data.accessToken;
	});

	it('updates and archives a product', async () => {
		const cat = await Category.create({ name: 'Engine', slug: 'engine' });
		const created = await request(app)
			.post('/api/v1/products')
			.set('Authorization', `Bearer ${token}`)
			.send({
				name: 'Oil Filter',
				description: 'Premium',
				retailPrice: 40,
				wholesalePrice: 30,
				wholesaleThreshold: 10,
				stock: 100,
				category: cat._id.toString(),
			})
			.expect(201);

		const productId = created.body.data._id;
		await request(app)
			.patch(`/api/v1/products/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.send({ stock: 60, brand: 'ACME' })
			.expect(200);

		const updated = await Product.findById(productId);
		expect(updated.stock).toBe(60);
		expect(updated.brand).toBe('ACME');

		await request(app)
			.delete(`/api/v1/products/${productId}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		const archived = await Product.findById(productId);
		expect(archived.isArchived).toBe(true);
	});

	it('refunds a sale and restores stock', async () => {
		const cat = await Category.create({ name: 'Wheels', slug: 'wheels' });
		const product = await Product.create({
			name: 'Alloy Wheel',
			description: '17 inch',
			retailPrice: 500,
			wholesalePrice: 400,
			wholesaleThreshold: 5,
			stock: 5,
			category: cat._id,
		});

		const saleRes = await request(app)
			.post('/api/v1/sales')
			.set('Authorization', `Bearer ${token}`)
			.send({
				soldProducts: [{ productId: product._id.toString(), quantity: 2 }],
				paymentMethod: 'cash',
				paymentStatus: 'paid',
			})
			.expect(201);

		const saleId = saleRes.body.data._id;
		let afterSale = await Product.findById(product._id);
		expect(afterSale.stock).toBe(3);


		await request(app)
			.post(`/api/v1/sales/${saleId}`)
			.set('Authorization', `Bearer ${token}`)
			.expect(200);

		const restored = await Product.findById(product._id);
		expect(restored.stock).toBe(5);
	});

	it('reports dashboard metrics returns 200', async () => {
		await request(app)
			.get('/api/v1/reports/dashboard-metrics')
			.set('Authorization', `Bearer ${token}`)
			.expect(200);
	});
});


