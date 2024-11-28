import express from 'express';
import { createClient } from 'redis';

const app = express();
const port = 3000;

const EXPIRATION = 3600; // seconds

// Create Redis client
// leave it blank for local dev default localhost:6379
// const client = createClient();

// or Replace with your Redis cloud URL
// const client = createClient({
// 	url: 'redis://xxxxxxxxxx.redislabs.com:12001',
// });

// or Replace with your Redis cloud URL
// const client = createClient({
//     password: '*******',
//     socket: {
//         host: xxxxxxxxxxxxxx2.gce.redns.redis-cloud.com',
//         port: 14788
//     }
// });

// or Replace with your Redis local URL
const client = createClient({
	url: 'redis://localhost:6379',
});

// Handle connection errors
client.on('error', (err) => console.error('Redis Client Error', err));

// Middleware to ensure Redis is connected
const connectRedis = async (req, res, next) => {
	if (!client.isOpen) {
		await client.connect();
	}
	next();
};

app.use(connectRedis);

app.get('/photos', async (req, res) => {
	try {
		// Try to get cached photos
		const cachedPhotos = await client.get('photos');
		if (!cachedPhotos) {
			// Fetch from API if no cache
			const response = await fetch(
				'https://jsonplaceholder.typicode.com/photos'
			);
			const data = await response.json();

			// Cache the data
			await client.set('photos', JSON.stringify(data), {
				EX: EXPIRATION,
			});

			res.json(data);
		} else {
			// Return cached photos
			res.json(JSON.parse(cachedPhotos));
		}
	} catch (error) {
		console.error('Error in /photos route:', error);
		res.status(500).json({ error: 'Internal Server Error' });
	}
});

// Connect to Redis and start server
async function startServer() {
	try {
		// Start Express server
		app.listen(port, () => {
			console.log(`Server is running on port ${port}`);
		});
	} catch (error) {
		console.error('Failed to connect to Redis:', error);
	}
}

startServer();
