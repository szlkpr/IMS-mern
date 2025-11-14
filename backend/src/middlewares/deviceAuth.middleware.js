export const verifyDevice = (req, res, next) => {
	const deviceId = req.header("x-device-id");
	const apiKey = req.header("x-api-key");
	if (!deviceId || !apiKey) {
		return res.status(401).json({ message: "Missing device credentials" });
	}

	// Option A: per-device secrets via env DEVICE_<ID>_KEY
	const perDeviceKey = process.env[`DEVICE_${String(deviceId).toUpperCase().replace(/[^A-Z0-9]/g, "_")}_KEY`];
	// Option B: single shared device key
	const sharedKey = process.env.DEVICE_API_KEY;

	const valid = (perDeviceKey && apiKey === perDeviceKey) || (sharedKey && apiKey === sharedKey);
	if (!valid) {
		return res.status(401).json({ message: "Invalid device credentials" });
	}
	return next();
};


