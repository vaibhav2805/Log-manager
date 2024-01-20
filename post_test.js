const axios = require('axios');

const logEntry ={
	"level": "error",
	"message": "Failed to connect to DB",
    "resourceId": "server-1234",
	"timestamp": "2029-09-15T08:00:00Z",
	"traceId": "abc-xyz-123",
    "spanId": "span-456",
    "commit": "5e5342f",
    "metadata": {
        "parentResourceId": "server-0987"
    }
};

axios.post('http://localhost:3000/logs', logEntry)
  .then(response => {
    console.log('Log ingested successfully:', response.data);
  })
  .catch(error => {
    console.error('Error ingesting log:', error.response ? error.response.data : error.message);
  });
