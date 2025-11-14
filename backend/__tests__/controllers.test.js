import request from 'supertest';
import app from '../src/app.js';
import { User } from '../src/models/user.model.js';
import { Category } from '../src/models/category.model.js';
import { Product } from '../src/models/product.model.js';

describe('Controllers and middleware edge cases', () => {
	let token;

	beforeEach(async () => {
		await User.create({
			name: 'Edge Admin',
			email: 'edge@example.com',
			password: 'Password123!',
			role: 'admin',
		});
		const res = await request(app)
			.post('/api/v1/users/login')
			.send({ email: 'edge@example.com', password: 'Password123!' })
			.expect(200);
		token = res.body?.data?.accessToken;
	});

	it('auth middleware rejects missing token on protected route', async () => {
		await request(app)
			.post('/api/v1/products')
			.send({})
			.expect(401);
	});

	it('product.controller validation failure returns 400', async () => {
		await request(app)
			.post('/api/v1/products')
			.set('Authorization', `Bearer ${token}`)
			.send({ name: '', description: '', retailPrice: null })
			.expect(400);
	});

	it('sale.controller blocks insufficient stock', async () => {
		const cat = await Category.create({ name: 'TestCat', slug: 'testcat' });
		const product = await Product.create({
			name: 'Limited Item',
			description: 'Only 2 in stock',
			retailPrice: 10,
			wholesalePrice: 8,
			wholesaleThreshold: 10,
			stock: 2,
			category: cat._id,
		});

		await request(app)
			.post('/api/v1/sales')
			.set('Authorization', `Bearer ${token}`)
			.send({
				soldProducts: [{ productId: product._id.toString(), quantity: 5 }],
				paymentMethod: 'cash',
				paymentStatus: 'paid',
			})
			.expect(400);
	});

	it('user.controller invalid login returns 401', async () => {
		await request(app)
			.post('/api/v1/users/login')
			.send({ email: 'edge@example.com', password: 'WrongPass!' })
			.expect(401);
	});
});


