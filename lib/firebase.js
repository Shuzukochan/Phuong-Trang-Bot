const admin = require('firebase-admin');

class FirebaseService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      if (this.isInitialized) return true;

      // Initialize Firebase Admin with service account
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
      };

      if (!serviceAccount.project_id) {
        console.error('❌ Firebase config missing! Please check .env file');
        return false;
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`
      });

      this.db = admin.firestore();
      this.isInitialized = true;
      console.log('✅ Connected to Firebase Firestore');
      return true;
    } catch (error) {
      console.error('❌ Firebase connection error:', error.message);
      return false;
    }
  }

  // Collection references - lazy loaded after initialization
  get ShuzukoUser() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'users');
  }

  get ShuzukoGuild() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'guilds');
  }

  get ShuzukoConfession() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'confessions');
  }

  get ShuzukoResponder() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'responders');
  }

  get ShuzukoWelcome() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'welcome');
  }

  get ShuzukoAutoresponder() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'autoresponders');
  }

  get ShuzukoConfess() {
    if (!this.db) throw new Error('Firebase not initialized. Call initialize() first.');
    return new FirestoreCollection(this.db, 'confess');
  }
}

class FirestoreCollection {
  constructor(db, collectionName) {
    this.db = db;
    this.collectionName = collectionName;
    this.collection = db.collection(collectionName);
  }

  // Find one document
  async findOne(query = {}) {
    try {
      if (query.userID || query.guildID || query.guildId) {
        const id = query.userID || query.guildID || query.guildId;
        const doc = await this.collection.doc(id).get();
        if (doc.exists) {
          return { id: doc.id, ...doc.data() };
        }
        return null;
      }

      // For other queries, get first match
      const snapshot = await this.buildQuery(query).limit(1).get();
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`Error in findOne (${this.collectionName}):`, error);
      return null;
    }
  }

  // Find multiple documents
  async find(query = {}) {
    try {
      const snapshot = await this.buildQuery(query).get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error(`Error in find (${this.collectionName}):`, error);
      return [];
    }
  }

  // Update or create document
  async updateOne(query, updateData, options = {}) {
    try {
      const { $set = {}, $inc = {} } = updateData;
      
      if (query.userID || query.guildID || query.guildId) {
        const id = query.userID || query.guildID || query.guildId;
        const docRef = this.collection.doc(id);
        
        // Always use upsert behavior - get existing doc or create new
        const doc = await docRef.get();
        const existingData = doc.exists ? doc.data() : {};
        
        // Apply $set operations
        const newData = { ...existingData, ...$set };
        
        // Apply $inc operations
        Object.keys($inc).forEach(key => {
          newData[key] = (existingData[key] || 0) + $inc[key];
        });
        
        // Add timestamps
        if (!doc.exists) {
          newData.createdAt = admin.firestore.FieldValue.serverTimestamp();
        }
        newData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        
        await docRef.set(newData, { merge: true });
        return { acknowledged: true };
      }
      
      return { acknowledged: false };
    } catch (error) {
      console.error(`Error in updateOne (${this.collectionName}):`, error);
      return { acknowledged: false };
    }
  }

  // Create new document
  async create(data) {
    try {
      const docRef = await this.collection.add({
        ...data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error(`Error in create (${this.collectionName}):`, error);
      return null;
    }
  }

  // Delete document
  async deleteOne(query) {
    try {
      if (query.userID || query.guildID || query.guildId) {
        const id = query.userID || query.guildID || query.guildId;
        await this.collection.doc(id).delete();
        return { acknowledged: true };
      }
      return { acknowledged: false };
    } catch (error) {
      console.error(`Error in deleteOne (${this.collectionName}):`, error);
      return { acknowledged: false };
    }
  }

  // Save document (placeholder method)
  async save() {
    // Placeholder method for compatibility
    return this;
  }

  // Build Firestore query from query object
  buildQuery(query) {
    let firestoreQuery = this.collection;
    
    Object.keys(query).forEach(key => {
      if (key !== 'userID' && key !== 'guildID' && key !== 'guildId') {
        firestoreQuery = firestoreQuery.where(key, '==', query[key]);
      }
    });
    
    return firestoreQuery;
  }
}

// Global Firebase instance
const firebaseService = new FirebaseService();

// Connect to Firebase
const connectFirebase = async () => {
  const connected = await firebaseService.initialize();
  if (connected) {
    return firebaseService;
  }
  throw new Error('Failed to connect to Firebase');
};

// Export for compatibility with existing code
module.exports = {
  connectDB: connectFirebase,
  createModel: () => firebaseService, // For compatibility
  // Export database collections as functions to avoid early initialization
  get ShuzukoUser() { return firebaseService.ShuzukoUser; },
  get ShuzukoGuild() { return firebaseService.ShuzukoGuild; },
  get ShuzukoConfession() { return firebaseService.ShuzukoConfession; },
  get ShuzukoResponder() { return firebaseService.ShuzukoResponder; },
  get ShuzukoWelcome() { return firebaseService.ShuzukoWelcome; },
  get ShuzukoAutoresponder() { return firebaseService.ShuzukoAutoresponder; },
  get ShuzukoConfess() { return firebaseService.ShuzukoConfess; },
  // Export for compatibility
  Database: {
    get ShuzukoUser() { return firebaseService.ShuzukoUser; },
    get ShuzukoGuild() { return firebaseService.ShuzukoGuild; },
    get ShuzukoConfession() { return firebaseService.ShuzukoConfession; },
    get ShuzukoResponder() { return firebaseService.ShuzukoResponder; },
    get ShuzukoWelcome() { return firebaseService.ShuzukoWelcome; },
    get ShuzukoAutoresponder() { return firebaseService.ShuzukoAutoresponder; },
    get ShuzukoConfess() { return firebaseService.ShuzukoConfess; }
  },
  firebaseService
}; 
