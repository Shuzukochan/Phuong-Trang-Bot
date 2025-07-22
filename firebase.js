const admin = require('firebase-admin');
const colors = require('./ui/colors/colors.js');

let db;

async function initializeFirebase() {
    try {
        // Initialize Firebase Admin - access trực tiếp từ .env
        if (!admin.apps.length) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    type: "service_account",
                    project_id: process.env.FIREBASE_PROJECT_ID,
                    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                    client_email: process.env.FIREBASE_CLIENT_EMAIL,
                    client_id: process.env.FIREBASE_CLIENT_ID,
                    auth_uri: "https://accounts.google.com/o/oauth2/auth",
                    token_uri: "https://oauth2.googleapis.com/token"
                })
                // Không cần databaseURL cho Firestore!
            });
        }

        // Get Firestore database reference
        db = admin.firestore();
        
        console.log(`${colors.cyan}[ FIRESTORE ]${colors.reset} ${colors.green}Connected successfully ✅${colors.reset}`);
        return db;
        
    } catch (error) {
        console.error(`${colors.red}[ FIRESTORE ERROR ]${colors.reset}`, error);
        throw error;
    }
}

// Firestore operations (giữ nguyên)
const FirestoreDB = {
    // Get document
    async getDoc(collection, docId) {
        try {
            const doc = await db.collection(collection).doc(docId).get();
            return doc.exists ? doc.data() : null;
        } catch (error) {
            console.error('Firestore getDoc error:', error);
            return null;
        }
    },

    // Set document
    async setDoc(collection, docId, data) {
        try {
            await db.collection(collection).doc(docId).set(data);
            return true;
        } catch (error) {
            console.error('Firestore setDoc error:', error);
            return false;
        }
    },

    // Update document
    async updateDoc(collection, docId, data) {
        try {
            await db.collection(collection).doc(docId).update(data);
            return true;
        } catch (error) {
            console.error('Firestore updateDoc error:', error);
            return false;
        }
    },

    // Delete document
    async deleteDoc(collection, docId) {
        try {
            await db.collection(collection).doc(docId).delete();
            return true;
        } catch (error) {
            console.error('Firestore deleteDoc error:', error);
            return false;
        }
    },

    // Add document với auto-generated ID
    async addDoc(collection, data) {
        try {
            const docRef = await db.collection(collection).add(data);
            return docRef.id;
        } catch (error) {
            console.error('Firestore addDoc error:', error);
            return null;
        }
    },

    // Query collection
    async getCollection(collection, limit = 10) {
        try {
            const snapshot = await db.collection(collection).limit(limit).get();
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            return docs;
        } catch (error) {
            console.error('Firestore getCollection error:', error);
            return [];
        }
    },

    // Query với điều kiện
    async query(collection, field, operator, value) {
        try {
            const snapshot = await db.collection(collection)
                .where(field, operator, value)
                .get();
            
            const docs = [];
            snapshot.forEach(doc => {
                docs.push({ id: doc.id, ...doc.data() });
            });
            return docs;
        } catch (error) {
            console.error('Firestore query error:', error);
            return [];
        }
    }
};

module.exports = {
    initializeFirebase,
    FirestoreDB,
    admin,
    
    // MongoDB-like collections for backward compatibility
    playlistCollection: {
        async findOne(query) {
            try {
                let ref = db.collection('playlists');
                
                // Convert MongoDB query to Firestore
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.limit(1).get();
                if (snapshot.empty) return null;
                
                const doc = snapshot.docs[0];
                return { id: doc.id, ...doc.data() };
            } catch (error) {
                console.error('Firestore findOne error:', error);
                return null;
            }
        },

        async find(query = {}) {
            try {
                let ref = db.collection('playlists');
                
                // Convert MongoDB query to Firestore
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.get();
                const docs = [];
                snapshot.forEach(doc => {
                    docs.push({ id: doc.id, ...doc.data() });
                });
                
                return {
                    toArray: () => docs
                };
            } catch (error) {
                console.error('Firestore find error:', error);
                return { toArray: () => [] };
            }
        },

        async insertOne(data) {
            try {
                const docRef = await db.collection('playlists').add(data);
                return { insertedId: docRef.id };
            } catch (error) {
                console.error('Firestore insertOne error:', error);
                throw error;
            }
        },

        async updateOne(query, updateData) {
            try {
                let ref = db.collection('playlists');
                
                // Find document first
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.limit(1).get();
                if (snapshot.empty) return { modifiedCount: 0 };
                
                const doc = snapshot.docs[0];
                
                // Handle MongoDB update operators
                const firebaseUpdate = {};
                if (updateData.$set) {
                    Object.assign(firebaseUpdate, updateData.$set);
                }
                if (updateData.$pull) {
                    // Handle array operations
                    for (const [field, condition] of Object.entries(updateData.$pull)) {
                        const currentData = doc.data();
                        if (currentData[field] && Array.isArray(currentData[field])) {
                            firebaseUpdate[field] = currentData[field].filter(item => {
                                if (typeof condition === 'object') {
                                    return !Object.entries(condition).every(([key, value]) => item[key] === value);
                                }
                                return item !== condition;
                            });
                        }
                    }
                }
                
                await doc.ref.update(firebaseUpdate);
                return { modifiedCount: 1 };
            } catch (error) {
                console.error('Firestore updateOne error:', error);
                return { modifiedCount: 0 };
            }
        },

        async deleteOne(query) {
            try {
                let ref = db.collection('playlists');
                
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.limit(1).get();
                if (snapshot.empty) return { deletedCount: 0 };
                
                await snapshot.docs[0].ref.delete();
                return { deletedCount: 1 };
            } catch (error) {
                console.error('Firestore deleteOne error:', error);
                return { deletedCount: 0 };
            }
        }
    },

    autoplayCollection: {
        async findOne(query) {
            try {
                let ref = db.collection('autoplay');
                
                // Convert MongoDB query to Firestore
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.limit(1).get();
                
                if (snapshot.empty) {
                    return null;
                }
                
                return snapshot.docs[0].data();
            } catch (error) {
                console.error('Firestore autoplay findOne error:', error);
                return null;
            }
        },

        async updateOne(query, updateData, options = {}) {
            try {
                let ref = db.collection('autoplay');
                
                // Find document first
                for (const [key, value] of Object.entries(query)) {
                    ref = ref.where(key, '==', value);
                }
                
                const snapshot = await ref.limit(1).get();
                
                if (snapshot.empty && options.upsert) {
                    // Create new document
                    const newData = { ...query };
                    if (updateData.$set) {
                        Object.assign(newData, updateData.$set);
                    }
                    await db.collection('autoplay').add(newData);
                    return { modifiedCount: 1, upsertedCount: 1 };
                } else if (!snapshot.empty) {
                    // Update existing document
                    const doc = snapshot.docs[0];
                    const firebaseUpdate = {};
                    if (updateData.$set) {
                        Object.assign(firebaseUpdate, updateData.$set);
                    }
                    await doc.ref.update(firebaseUpdate);
                    return { modifiedCount: 1 };
                }
                
                return { modifiedCount: 0 };
            } catch (error) {
                console.error('Firestore autoplay updateOne error:', error);
                return { modifiedCount: 0 };
            }
        }
    }
};
