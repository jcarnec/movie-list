const { MongoClient } = require('mongodb');

async function connectToMongoDB() {
  const configs = [
    {
      name: "Old MongoDB",
      url: "mongodb://localhost:27017",
      dbName: "test",
    },
    {
      name: "New MongoDB",
      url: "mongodb://localhost:27018",
      dbName: "test",
    },
  ];

  for (const config of configs) {
    console.log(`\nConnecting to ${config.name}...`);
    try {
      const client = new MongoClient(config.url);
      await client.connect();
      console.log(`Connected successfully to ${config.name}`);

      const db = client.db(config.dbName);
      console.log(`Available collections in ${config.dbName}:`);
      const collections = await db.listCollections().toArray();
      collections.forEach((col) => console.log(`- ${col.name}`));

      await client.close();
      console.log(`Disconnected from ${config.name}`);
    } catch (error) {
      console.error(`Error connecting to ${config.name}:`, error.message);
    }
  }
}

connectToMongoDB();
