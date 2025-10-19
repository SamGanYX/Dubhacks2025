// populateDummyData.js
const db = require("./db");

// Sample data
const dummyData = {
  "Alice": ["UTS-11", "UTS-12"],
  "Bob": ["UTS-13"],
};

// Insert or update users
for (const [username, requests] of Object.entries(dummyData)) {
  const jsonRequests = JSON.stringify(requests);
  db.run(
    `INSERT INTO user_requests (username, requests) VALUES (?, ?)
     ON CONFLICT(username) DO UPDATE SET requests=excluded.requests`,
    [username, jsonRequests],
    (err) => {
      if (err) console.error("Error inserting", username, err);
      else console.log("Inserted/updated user:", username);
    }
  );
}

// Close DB after all inserts
db.close((err) => {
  if (err) console.error("Error closing DB", err);
  else console.log("Database closed successfully");
});
