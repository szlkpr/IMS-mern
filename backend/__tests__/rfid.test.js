import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app';
import mongoose from 'mongoose';
import { Category } from '../src/models/category.model';
import { Product } from '../src/models/product.model';
import RfidTag from '../src/models/rfidTag.model';
import WebSocketService from '../src/services/websocket.service'; // Import the actual service

// Mock the broadcastSaleAlert method on the imported WebSocketService instance
jest.spyOn(WebSocketService, 'broadcastSaleAlert').mockImplementation(jest.fn());

describe('RFID Endpoint: /api/v1/rfid/scan', () => {
    let product;
    let rfidTag;
    const deviceId = 'ESP32_TEST_DEVICE';
    const apiKey = 'SUPER_SECRET_KEY';

    beforeEach(async () => {
        // Set up the environment variable for the API key
        process.env[`DEVICE_${deviceId}_KEY`] = apiKey;

        // Create a category and product for testing
        const category = await Category.create({ name: 'Test Category', slug: 'test-category' });
        product = await Product.create({
            name: 'Test Product',
            description: 'A product for testing RFID scans',
            retailPrice: 100,
            wholesalePrice: 80,
            wholesaleThreshold: 10,
            stock: 10,
            category: category._id,
        });

        // Create an active RFID tag linked to the product
        rfidTag = await RfidTag.create({
            tagId: 'TEST_TAG_123',
            productId: product._id,
            status: 'active',
        });
    });

    afterEach(async () => {
        // Clean up the database and environment variables
        await mongoose.connection.db.dropDatabase();
        delete process.env[`DEVICE_${deviceId}_KEY`];
        jest.clearAllMocks();
    });

    it('should process a successful RFID scan and create a sale', async () => {
        const res = await request(app)
            .post('/api/v1/rfid/scan')
            .set('x-device-id', deviceId)
            .set('x-api-key', apiKey)
            .send({ tagId: rfidTag.tagId })
            .expect(200);

        expect(res.body.ok).toBe(true);
        expect(res.body.saleId).toBeDefined();
        expect(res.body.invoiceNumber).toBeDefined();

        // Verify stock was decremented
        const updatedProduct = await Product.findById(product._id);
        expect(updatedProduct.stock).toBe(9);

        // Verify WebSocket notification was called
        expect(WebSocketService.broadcastSaleAlert).toHaveBeenCalledTimes(1);
    });

    it('should return 404 for an unknown or inactive RFID tag', async () => {
        await request(app)
            .post('/api/v1/rfid/scan')
            .set('x-device-id', deviceId)
            .set('x-api-key', apiKey)
            .send({ tagId: 'UNKNOWN_TAG' })
            .expect(404);
    });

    it('should return 409 for insufficient stock', async () => {
        // Set stock to 0
        product.stock = 0;
        await product.save();

        await request(app)
            .post('/api/v1/rfid/scan')
            .set('x-device-id', deviceId)
            .set('x-api-key', apiKey)
            .send({ tagId: rfidTag.tagId, quantity: 1 })
            .expect(409);
    });

    it('should return 401 for a missing API key', async () => {
        await request(app)
            .post('/api/v1/rfid/scan')
            .set('x-device-id', deviceId)
            .send({ tagId: rfidTag.tagId })
            .expect(401);
    });

    it('should return 401 for an invalid API key', async () => {
        await request(app)
            .post('/api/v1/rfid/scan')
            .set('x-device-id', deviceId)
            .set('x-api-key', 'INVALID_KEY')
            .send({ tagId: rfidTag.tagId })
            .expect(401);
    });
});
