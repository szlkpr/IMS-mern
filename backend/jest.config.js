export default {
	testEnvironment: 'node',
	roots: ['<rootDir>/src', '<rootDir>/__tests__'],
	testMatch: ['**/__tests__/**/*.test.js'],
	transform: {},
	setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
	coverageDirectory: '<rootDir>/coverage',
	collectCoverageFrom: [
		'<rootDir>/src/models/**/*.js',
		'<rootDir>/src/middlewares/**/*.js',
		'<rootDir>/src/routes/product.routes.js',
		'<rootDir>/src/routes/sale.routes.js',
		'<rootDir>/src/routes/user.routes.js',
		'<rootDir>/src/routes/reports.routes.js'
	],
};

