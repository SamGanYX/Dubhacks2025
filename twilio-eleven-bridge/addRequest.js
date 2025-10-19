// addRequest.js
const db = require("./db");

function addRequest(userEmail, requestCode, description) {
  db.serialize(() => {
    // 1️⃣ Get user
    db.get(`SELECT id FROM users WHERE email = ?`, [userEmail], (err, user) => {
      if (err) throw err;
      if (!user) {
        console.log("User not found!");
        return;
      }

      // 2️⃣ Insert request
      db.run(
        `INSERT INTO requests (request_code, description) VALUES (?, ?)`,
        [requestCode, description],
        function(err) {
          if (err) throw err;

          // 3️⃣ Map user to request
          db.run(
            `INSERT INTO users_requests (user_id, request_id) VALUES (?, ?)`,
            [user.id, this.lastID],
            (err) => {
              if (err) throw err;
              console.log(`Request ${requestCode} added for user ${userEmail}`);
            }
          );
        }
      );
    });
  });
}

module.exports = addRequest;


function getUserRequests(userEmail, callback) {
  const query = `
    SELECT r.request_code, r.description, r.status, r.created_at
    FROM requests r
    JOIN users_requests ur ON r.id = ur.request_id
    JOIN users u ON ur.user_id = u.id
    WHERE u.email = ?
  `;
  db.all(query, [userEmail], (err, rows) => {
    if (err) throw err;
    callback(rows);
  });
}
