// queryRequests.js
const db = require("./db");

// Example: get requests for a user
function getRequests(username) {
  db.get("SELECT requests FROM user_requests WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error(err);
    } else if (row) {
      const requests = JSON.parse(row.requests);
      console.log(username, "has requests:", requests);
    } else {
      console.log(username, "not found");
    }
  });
}

// Example usage
getRequests("Alice");
getRequests("Bob");

// Close after query
db.close();
