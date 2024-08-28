const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from the root directory

// Import nanoid and MongoClient dynamically
let nanoid;
let MongoClient;

async function initialize() {
    nanoid = (await import('nanoid')).nanoid;
    MongoClient = (await import('mongodb')).MongoClient;

    const uri = 'mongodb+srv://marvinmaiwang:Pop0OC2HMHAAYS6O@cluster0.kzxnu.mongodb.net/urlShortener?retryWrites=true&w=majority';
    const client = new MongoClient(uri);
    const dbName = 'urlShortener';
    let db;

    app.post('/shorten', async (req, res) => {
        const { longUrl, customBackHalf } = req.body;
        if (!longUrl) {
            return res.status(400).json({ error: 'Long URL is required' });
        }

        const shortId = customBackHalf ? customBackHalf : nanoid(6);
        const shortUrl = `https://url.brt.ar/${shortId}`;


        try {
            const collection = db.collection('urls');
            await collection.updateOne(
                { shortId },
                { $set: { longUrl, shortId } },
                { upsert: true }
            );

            res.json({ shortUrl });
        } catch (err) {
            res.status(500).json({ error: 'An error occurred' });
        }
    });

    app.get('/:shortId', async (req, res) => {
        const { shortId } = req.params;
        try {
            const collection = db.collection('urls');
            const record = await collection.findOne({ shortId });
            if (record) {
                res.redirect(record.longUrl);
            } else {
                res.status(404).send('Not found');
            }
        } catch (err) {
            res.status(500).send('An error occurred');
        }
    });

    try {
        console.log('Connecting to MongoDB...');
        await client.connect();
        db = client.db(dbName);
        console.log(`Server running at http://localhost:${port}`);
        app.listen(port);
    } catch (err) {
        console.error('Failed to connect to the database', err);
    }
}

initialize();
