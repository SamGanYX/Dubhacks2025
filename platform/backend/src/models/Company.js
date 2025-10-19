// src/models/Company.js
import db from '../database.js'; // Import your new knex connection

const TABLE_NAME = 'companies';

// Helper to handle JSON stringification for SQLite
const prepareForSave = (data) => {
  const copy = { ...data };
  copy.jiraConfig = JSON.stringify(copy.jiraConfig);
  copy.serviceDeskConfig = JSON.stringify(copy.serviceDeskConfig);
  copy.subscription = JSON.stringify(copy.subscription);
  return copy;
};

// Helper to handle JSON parsing from SQLite
const parseFromDb = (data) => {
  if (!data) return null;
  const copy = { ...data };
  try {
    copy.jiraConfig = JSON.parse(copy.jiraConfig);
    copy.serviceDeskConfig = JSON.parse(copy.serviceDeskConfig);
    copy.subscription = JSON.parse(copy.subscription);
  } catch (e) {
    console.error('Failed to parse JSON from DB', e);
  }
  return copy;
};

export class Company {
  constructor(data) {
    // Parse data if it's coming from the DB
    const parsedData = (typeof data.jiraConfig === 'string') ? parseFromDb(data) : data;

    this.id = parsedData.id || this.generateId();
    this.name = parsedData.name;
    this.domain = parsedData.domain;
    this.industry = parsedData.industry;
    this.size = parsedData.size;
    this.contactEmail = parsedData.contactEmail;
    this.phoneNumber = parsedData.phoneNumber;
    
    this.jiraConfig = parsedData.jiraConfig || {
      workspaceName: '',
      adminEmail: '',
      timezone: 'UTC',
      language: 'en',
      siteId: null,
      serviceDeskId: null,
      forgeAppId: null,
      setupStatus: 'pending',
    };
    this.serviceDeskConfig = parsedData.serviceDeskConfig || {
      workTypes: [],
      requestTypes: [],
    };
    this.status = parsedData.status || 'pending';
    this.subscription = parsedData.subscription || {
      plan: 'trial',
      startDate: new Date().toISOString(),
      maxTickets: 100,
      ticketsUsed: 0,
    };
    this.createdAt = parsedData.createdAt || new Date().toISOString();
    this.updatedAt = parsedData.updatedAt || new Date().toISOString();
  }

  generateId() {
    return `company_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Save company to SQLite
  async save() {
    this.updatedAt = new Date().toISOString();
    const dataToSave = prepareForSave(this);
    
    await db(TABLE_NAME).insert(dataToSave);
    return this;
  }

  // Find company by ID
  static async findById(id) {
    try {
      const item = await db(TABLE_NAME).where({ id: id }).first();
      return item ? new Company(item) : null;
    } catch (error) {
      console.error('Error finding company by ID:', error);
      return null;
    }
  }

  // Find company by domain
  static async findByDomain(domain) {
    try {
      const item = await db(TABLE_NAME).where({ domain: domain }).first();
      return item ? new Company(item) : null;
    } catch (error) {
      console.error('Error finding company by domain:', error);
      return null;
    }
  }

  // Find company by email
  static async findByEmail(email) {
    try {
      const item = await db(TABLE_NAME).where({ contactEmail: email }).first();
      return item ? new Company(item) : null;
    } catch (error) {
      console.error('Error finding company by email:', error);
      return null;
    }
  }

  // Find companies by status
  static async findByStatus(status) {
    try {
      const items = await db(TABLE_NAME).where({ status: status });
      return items ? items.map((item) => new Company(item)) : [];
    } catch (error) {
      console.error('Error finding companies by status:', error);
      return [];
    }
  }

  // Get all companies with pagination and filters
  static async findAll(filters = {}, limit = 10, lastKey = null) {
    // Note: 'lastKey' pagination is tricky in SQL. Offset is simpler.
    // This example uses offset based pagination.
    const page = parseInt(lastKey) || 1;
    const offset = (page - 1) * limit;

    try {
      const query = db(TABLE_NAME);

      // Build filter query
      const whereClause = {};
      if (filters.status) {
        whereClause.status = filters.status;
      }
      if (filters.industry) {
        whereClause.industry = filters.industry;
      }
      query.where(whereClause);
      
      if (filters.search) {
        query.where((builder) => {
          builder
            .where('name', 'like', `%${filters.search}%`)
            .orWhere('domain', 'like', `%${filters.search}%`);
        });
      }
      
      // Get total count for pagination
      const totalCount = await query.clone().count('id as count').first();
      
      // Get paginated items
      const items = await query.limit(limit).offset(offset);

      return {
        companies: items ? items.map((item) => new Company(item)) : [],
        lastKey: page + 1, // For offset pagination, 'lastKey' is now 'nextPage'
        count: totalCount.count,
      };
    } catch (error) {
      console.error('Error finding all companies:', error);
      return { companies: [], lastKey: null, count: 0 };
    }
  }

  // Update company
  async update(updates) {
    this.updatedAt = new Date().toISOString();
    
    // Merge updates into 'this' instance
    Object.assign(this, updates);
    
    // Prepare a clean 'updates' object for the DB
    const updatesForDb = { ...updates, updatedAt: this.updatedAt };
    
    // Stringify JSON fields if they are being updated
    if (updatesForDb.jiraConfig) {
      updatesForDb.jiraConfig = JSON.stringify(updatesForDb.jiraConfig);
    }
    if (updatesForDb.serviceDeskConfig) {
      updatesForDb.serviceDeskConfig = JSON.stringify(updatesForDb.serviceDeskConfig);
    }
    if (updatesForDb.subscription) {
      updatesForDb.subscription = JSON.stringify(updatesForDb.subscription);
    }

    try {
      await db(TABLE_NAME).where({ id: this.id }).update(updatesForDb);
      return this; // Return the updated instance
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  }

  // Delete company
  async delete() {
    try {
      await db(TABLE_NAME).where({ id: this.id }).del();
      return true;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  }

  // Virtual properties (THESE REMAIN UNCHANGED!)
  get isSetupComplete() {
    return (
      this.jiraConfig.setupStatus === 'completed' &&
      this.jiraConfig.siteId &&
      this.jiraConfig.serviceDeskId
    );
  }

  canCreateTicket() {
    return this.subscription.ticketsUsed < this.subscription.maxTickets;
  }

  async incrementTicketUsage() {
    this.subscription.ticketsUsed += 1;
    return this.update({ subscription: this.subscription });
  }

  // Static method (REMAINS ALMOST UNCHANGED!)
  static async findExisting(domain, email) {
    const [existingByDomain, existingByEmail] = await Promise.all([
      Company.findByDomain(domain),
      Company.findByEmail(email),
    ]);
    return existingByDomain || existingByEmail;
  }
}

export default Company;