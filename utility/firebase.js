const admin = require('firebase-admin');

// Khởi tạo Firebase Admin SDK
let firebaseApp = null;

function initializeFirebase() {
    if (!firebaseApp) {
        try {
            // Parse private key từ environment variable
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
            
            const serviceAccount = {
                type: "service_account",
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: privateKey,
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: "https://accounts.google.com/o/oauth2/auth",
                token_uri: "https://oauth2.googleapis.com/token",
                auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
                client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
            };

            firebaseApp = admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
            });

            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    }
    return firebaseApp;
}

function getFirestore() {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return admin.firestore();
}

function getDatabase() {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return admin.database();
}

module.exports = {
    initializeFirebase,
    getFirestore,
    getDatabase,
    admin
};
