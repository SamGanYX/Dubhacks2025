// populateCompanyData.js
import db from './db.js';
import { v4 as uuidv4 } from 'uuid';

const companyData = {
  id: uuidv4(),
  name: "Example Corp",
  domain: "example.com",
  industry: "Technology",
  size: "201-500",
  contactEmail: "contact@example.com",
  phoneNumber: "123-456-7890",
  status: "active",
  jiraConfig: { projectKey: "EX", boardId: 123 },
  serviceDeskConfig: { deskId: 456 },
  subscription: { plan: "Pro", renewalDate: "2025-12-31" }
};

const insertQuery = `
  INSERT INTO companies (
    id, name, domain, industry, size, contactEmail, phoneNumber,
    status, jiraConfig, serviceDeskConfig, subscription
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

db.run(insertQuery, [
  companyData.id,
  companyData.name,
  companyData.domain,
  companyData.industry,
  companyData.size,
  companyData.contactEmail,
  companyData.phoneNumber,
  companyData.status,
  JSON.stringify(companyData.jiraConfig),
  JSON.stringify(companyData.serviceDeskConfig),
  JSON.stringify(companyData.subscription)
], function (err) {
  if (err) {
    console.error("❌ Error inserting company:", err);
  } else {
    console.log("✅ Company inserted with ID:", companyData.id);
  }

  // Close the DB connection
  db.close((err) => {
    if (err) console.error("Error closing DB", err);
    else console.log("🔒 Database connection closed");
  });
});
