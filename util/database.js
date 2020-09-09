const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

let __db;

const mongoConnect = (callback) => {
    mongoClient.connect(
        'mongodb://localhost:27017/node-shop',
        { useUnifiedTopology: true }
    )
        .then(client => {
            console.log('Conected');
            __db = client.db();
            callback(client);
        })
        .catch(err => {
            console.log(err);
            throw err;
        })
}

const getDB = () => {
    if (__db) {
        return __db;
    }
    throw 'No database found';
}
module.exports = { mongoConnect, getDB };
