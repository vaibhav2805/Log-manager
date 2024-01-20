const express = require('express');
const bodyParser = require('body-parser');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = 3000;
const MONGODB_URL = 'mongodb://127.0.0.1:27017';
const DB_NAME = 'logsdb';
const COLLECTION_NAME = 'logs';
const cors = require('cors');

let db;
app.use(cors());
// Middleware to parse JSON in the request body
app.use(bodyParser.json());

// Route to handle POST requests for log ingestion
app.post('/logs', async (req, res) => {
  const logEntry = req.body;

  // Validate if the incoming log has the required fields
  if (
    !logEntry ||
    !logEntry.timestamp ||
    !logEntry.message ||
    !logEntry.level ||
    !logEntry.resourceId ||
    !logEntry.traceId ||
    !logEntry.spanId ||
    !logEntry.commit ||
    !logEntry.metadata ||
    !logEntry.metadata.parentResourceId
  ) {
    return res.status(400).json({ error: 'Invalid log format' });
  }

  try {
    // Insert the log entry into MongoDB
    const result = await db.collection(COLLECTION_NAME).insertOne(logEntry);
    console.log(`Log ingested successfully. Log ID: ${result.insertedId}`);
    res.status(201).json({ message: 'Log ingested successfully' });
  } catch (error) {
    console.error('Error ingesting log:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle GET requests for log retrieval
app.get('/logs', async (req, res) => {
    const { level, message, resourceId, timestamp, traceId, spanId, commit, parentResourceId } = req.query;
  
    const queryFilter = {};
  
    // Build the MongoDB query based on the provided parameters
    if (level) queryFilter.level = level;
    if (message) queryFilter.message = { $regex: new RegExp(message, 'i') };
    if (resourceId) queryFilter.resourceId = resourceId;
    if (timestamp) queryFilter.timestamp = timestamp;
    if (traceId) queryFilter.traceId = traceId;
    if (spanId) queryFilter.spanId = spanId;
    if (commit) queryFilter.commit = commit;
    if (parentResourceId) queryFilter['metadata.parentResourceId'] = parentResourceId;
  
    try {
      // Retrieve logs based on the query
      const logs = await db.collection(COLLECTION_NAME).find(queryFilter).toArray();
      res.status(200).json(logs);
    } catch (error) {
      console.error('Error retrieving logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  

// Connect to MongoDB and start the server
async function startServer() {
  try {
    const client = new MongoClient(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db(DB_NAME);

    // Create a collection for logs if it doesn't exist
    if (!(await db.listCollections({ name: COLLECTION_NAME }).hasNext())) {
      await db.createCollection(COLLECTION_NAME);
      console.log(`Collection ${COLLECTION_NAME} created`);
    }

    // Start the Express server
    app.listen(PORT, () => {
      console.log(`Log Ingestor Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Call the function to start the server
startServer();
