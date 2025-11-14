import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Product } from '../src/models/product.model.js';

describe('Integration: auth, products, and sales', () => {
	let token;

	beforeEach(async () => {
		// Seed a user
		const user = await User.create({
			name: 'Test Admin',
			email: 'admin@example.com',
			password: 'Password123!',
			role: 'admin',
		});

		// Login to get token
		const res = await request(app)
			.post('/api/v1/users/login')
			.send({ email: 'admin@example.com', password: 'Password123!' })
			.expect(200);
		token = res.body?.data?.accessToken;
		expect(token).toBeTruthy();
	});

	it('creates a product via POST /api/v1/products and persists it', async () => {
		// Create category first
		const cat = await Category.create({ name: 'Brakes', slug: 'brakes' });

		const productPayload = {
			name: 'Brake Pad',
			description: 'High quality brake pad',
			retailPrice: 100,
			wholesalePrice: 80,
			wholesaleThreshold: 10,
			stock: 50,
			category: cat._id.toString(),
		};

		const res = await request(app)
			.post('/api/v1/products')
			.set('Authorization', `Bearer ${token}`)
			.send(productPayload)
			.expect(201);

		expect(res.body?.data?.name).toBe('Brake Pad');
		const inDb = await Product.findById(res.body.data._id);
		expect(inDb).toBeTruthy();
		expect(inDb.stock).toBe(50);
	});

	it('creates a sale and decrements product stock', async () => {
		const cat = await Category.create({ name: 'Lights', slug: 'lights' });
		const product = await Product.create({
			name: 'Headlight',
			description: 'LED headlight',
			retailPrice: 200,
			wholesalePrice: 150,
			wholesaleThreshold: 5,
			stock: 10,
			category: cat._id,
		});

		const salePayload = {
			soldProducts: [
				{ productId: product._id.toString(), quantity: 3 },
			],
			customerName: 'John Doe',
			customerContact: '9999999999',
			paymentMethod: 'cash',
			paymentStatus: 'paid',
		};

		const res = await request(app)
			.post('/api/v1/sales')
			.set('Authorization', `Bearer ${token}`)
			.send(salePayload)
			.expect(201);

		expect(res.body?.data?.soldProducts?.[0]?.quantity).toBe(3);
		const updated = await Product.findById(product._id);
		expect(updated.stock).toBe(7);
		expect(updated.status).toBe('in-stock');
	});
});


