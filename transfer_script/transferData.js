const { MongoClient } = require('mongodb');

const oldUri = 'mongodb://admin:mypass@localhost:27017/moviedb?authSource=admin';
const newUri = 'mongodb://admin:mypass@localhost:27018/moviedb?authSource=admin';

const batchSize = 1000; // Adjust as needed for your system's capacity

async function transferCollection(oldDb, newDb, collectionName) {
    const oldCollection = oldDb.collection(collectionName);
    const newCollection = newDb.collection(collectionName);

    const cursor = oldCollection.find(); // Get all documents from the old collection
    let batch = [];
    let totalTransferred = 0;

    while (await cursor.hasNext()) {
        batch.push(await cursor.next());

        // Insert in batches
        if (batch.length === batchSize) {
            await newCollection.insertMany(batch);
            totalTransferred += batch.length;
            console.log(`Transferred ${totalTransferred} documents from ${collectionName}`);
            batch = []; // Clear the batch
        }
    }

    // Insert remaining documents
    if (batch.length > 0) {
        await newCollection.insertMany(batch);
        totalTransferred += batch.length;
        console.log(`Transferred ${totalTransferred} documents from ${collectionName}`);
    }

    console.log(`Completed transfer for collection: ${collectionName}`);
}

async function transferAllCollections() {
    let oldClient, newClient;

    try {
        // Connect to the old and new MongoDB instances
        oldClient = await MongoClient.connect(oldUri, { useNewUrlParser: true, useUnifiedTopology: true });
        newClient = await MongoClient.connect(newUri, { useNewUrlParser: true, useUnifiedTopology: true });

        const oldDb = oldClient.db(); // Get old database
        const newDb = newClient.db(); // Get new database

        // Get all collection names from the old database
        const collections = await oldDb.listCollections().toArray();
        const collectionNames = collections.map((col) => col.name);

        for (const collectionName of collectionNames) {
            console.log(`Starting transfer for collection: ${collectionName}`);
            await transferCollection(oldDb, newDb, collectionName);
        }

        console.log('Data transfer complete');
    } catch (err) {
        console.error('Error transferring data:', err);
    } finally {
        // Ensure clients are closed
        if (oldClient) await oldClient.close();
        if (newClient) await newClient.close();
    }
}

transferAllCollections();
