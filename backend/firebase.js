// const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json'); // fornecido pelo Firebase

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
module.exports = db;

