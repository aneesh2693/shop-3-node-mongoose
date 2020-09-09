const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  userId:{
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
  }
});

module.exports = mongoose.model('Product', productSchema);

/*const mongodb = require('mongodb');
const getDB = require('../util/database').getDB;

class Product {
  constructor(id, title, imageUrl, price, description, userId) {
    this._id = id ? new mongodb.ObjectID(id) : null;
    this.title = title;
    this.imageUrl = imageUrl;
    this.price = price;
    this.description = description;
    this.userId = userId;
  }

  save() {
    const db = getDB();
    let dbOP;

    if (this._id) {
      dbOP = db.collection('products').updateOne(
        {
          _id: this._id //Checking for id
        },
        {
          $set: this
        }
      );
    }
    else {
      dbOP = db.collection('products').insertOne(this);
    }

    return dbOP.then(result => result)
      .catch(err => {
        console.log(err);
        throw err;
      });
  }

  static fetchAll() {
    const db = getDB();
    return db.collection('products')
      .find()
      .toArray()
      .then(products => products)
      .catch(err => console.log(err));
  }

  static findById(prodId) {
    const db = getDB();
    return db.collection('products')
      .find({ _id: new mongodb.ObjectID(prodId) })
      .next()
      .then(product => product)
      .catch(err => console.log(err));
  }

  static deleteById(prodId) {
    const db = getDB();
    console.log(prodId)
    return db.collection('products')
      .deleteOne({ _id: new mongodb.ObjectID(prodId) })
      .then(result=>result)
      .catch(err=>console.log(err));
  }

}

module.exports = Product;
*/