const { MongoClient, ObjectId } = require("mongodb");
const  mongoose  = require('mongoose');
const { config } = require("./config");
require("dotenv").config({ path: ".env" });

const USER = encodeURIComponent(config.mongo.user);
const PASSWORD = encodeURIComponent(config.mongo.password);
const PORT = config.mongo.port;
const DB_NAME = config.mongo.database;
const CONNECTION = config.mongo.connection;
const HOST = config.mongo.host;

// const MONGO_URI = `${CONNECTION}${USER}:${PASSWORD}@${HOST}:${PORT}/${DB_NAME}?retryWrites=true&w=majority`;
const MONGO_URI = `${CONNECTION}${HOST}:${PORT}/${DB_NAME}?retryWrites=true&w=majority`;

const conectedDB = async () => {
  
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true,
    });
  } catch (err) {
    console.log('Error al intentar conectar')
    console.log(err)
    process.exit(1);
  }


}

//const MONGO_URI = process.env.DB_MONGO;

// class MongoLib {
//   constructor() {

//     console.log(MONGO_URI);

//     this.client = new MongoClient(MONGO_URI , {
//        useNewUrlParser: true,
//        useUnifiedTopology: true,
//        useFindAndModify: false,
//        useCreateIndex: true,
//     });
//     this.dbName = DB_NAME;
//   }

//   async connect() {
//     if (!mongoose.connection) {
//       await mongoose.connect(MONGO_URI, {
//         useNewUrlParser: true,
//         useUnifiedTopology: true,
//         useFindAndModify: false,
//         useCreateIndex: true,
//       });
//       console.log("DB Connect");
//     }

//     return mongoose.connection;
//   }

  // getAll(collection, query) {
  //   return this.connect().then((db) => {
  //     return db.collection(collection).find(query).toArray();
  //   });
  // }

  // get(collection, id) {
  //   return this.connect().then((db) => {
  //     return db.collection(collection).findOne({ _id: ObjectId(id) });
  //   });
  // }

  // create(collection, data) {
  //   return this.connect()
  //     .then((db) => {
  //       return db.collection(collection).insertOne(data);
  //     })
  //     .then((result) => result.insertedId);
  // }

  // update(collection, id, data) {
  //   return this.connect()
  //     .then((db) => {
  //       return db.collection(collection).updateOne({ _id: ObjectID(id) }, { $set: data }, { upsert: true });
  //     })
  //     .then((result) => result.upsertedId || id);
  // }

  // delete(collection, id) {
  //   return this.connect()
  //     .then((db) => {
  //       return db.collection(collection).deleteOne({ _id: ObjectID(id) });
  //     })
  //     .then(() => id);
  // }
//}

module.exports = {
  conectedDB,
};
