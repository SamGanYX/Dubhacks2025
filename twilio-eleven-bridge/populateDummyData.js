// populateDummyData.js
import db from './db.js';

// Sample data
const dummyData = {
  "Bob": ["UTS-61"],
};

// Insert or update users
for (const [username, requests] of Object.entries(dummyData)) {
  const jsonRequests = JSON.stringify(requests);
  db.run(
    `INSERT INTO user_requests (username, requests) VALUES (?, ?)
     ON CONFLICT(username) DO UPDATE SET requests=excluded.requests`,
    [username, jsonRequests],
    (err) => {
      if (err) {
        console.error("Error inserting", username, err);
      } else {
        console.log("Inserted/updated user:", username);
      }
    }
  );
}

// Close DB after all inserts (add slight delay to allow async queries to finish)
setTimeout(() => {
  db.close((err) => {
    if (err) console.error("Error closing DB", err);
    else console.log("Database closed successfully");
  });
}, 500);
