const FirebaseModel = require('../utility/firebaseModel');

// Tạo các models Firebase tương ứng với MongoDB schemas
const createFirebaseModels = () => {
    return {
        ZiUser: new FirebaseModel('ZiUser'),
        ZiAutoresponder: new FirebaseModel('ZiAutoresponder'),
        ZiWelcome: new FirebaseModel('ZiWelcome'),
        ZiGuild: new FirebaseModel('ZiGuild'),
        ZiConfess: new FirebaseModel('ZiConfess')
    };
};

module.exports = {
    createFirebaseModels,
    FirebaseModel
};
