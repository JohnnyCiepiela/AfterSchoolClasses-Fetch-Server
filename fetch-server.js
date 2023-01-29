const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

let propertiesReader = require("properties-reader");
let propertiesPath = path.resolve(__dirname, "conf/db.properties");
let properties = propertiesReader(propertiesPath);

let dbPprefix = properties.get("db.prefix");
let dbUsername = encodeURIComponent(properties.get("db.user"));
let dbPwd = encodeURIComponent(properties.get("db.pwd"));
let dbName = properties.get("db.dbName");
let dbUrl = properties.get("db.dbUrl");
let dbParams = properties.get("db.params");

const uri = dbPprefix + dbUsername + ":" + dbPwd + dbUrl + dbParams;

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });
let db = client.db(dbName);


let app = express();
app.set('json spaces', 3);

/* app.use(function(req, res, next) {
   console.log("Incoming request: " + req.url);
   next();
}); */

var imagesPath = path.resolve(__dirname, "images");
app.use("/images", express.static(imagesPath));

app.use(cors());
app.use(morgan("short"));
app.use(express.json());


app.param('collectionName', function (req, res, next, collectionName) {
   req.collection = db.collection(collectionName);
   return next();
});

app.get('/', function (req, res, next) {
   res.send('Please select a collection, e.g., /collections/lessons')
});

/* app.get("/user", function(req, res) {

   res.json({
      "email": "user@email.com",
      "password": "password"
   });
   
}) */

app.get('/collections/:collectionName', function (req, res, next) {
   req.collection.find({}).toArray(function (err, results) {
      if (err) {
         return next(err);
      }
      res.send(results);
   });
});

app.get('/collections/:collectionName/search', function (req, res, next) {
   const searchTerm = req.query.q;
   req.collection.find({ location: { $regex: new RegExp(searchTerm, 'i') } }, { title: { $regex: new RegExp(searchTerm, 'i') } }).toArray(function (err, results) {
      if (err) {
         return next(err);
      }
      res.send(results);
   });
});

/* app.get('/collections/:collectionName/search', function (req, res, next) {
   const searchTerm = req.query.q;
   req.collection.find({ title: { $regex: new RegExp(searchTerm, 'i') } }).toArray(function (err, results) {
      if (err) {
         return next(err);
      }
      res.send(results);
   });
}); */

//For order submit
app.post('/collections/:collectionName', function (req, res, next) {
   req.collection.insertOne(req.body, function (err, results) {
      if (err) {
         return next(err);
      }
      res.send(results);
   });
});

app.put('/collections/:collectionName/:id', function (req, res, next) {
   req.collection.updateOne({ _id: new ObjectId(req.params.id) },
      { $set: req.body },
      { safe: true, multi: false }, function (err, results) {
         if (err) {
            return next(err);
         } else {
            res.send((result.matchedCount === 1) ? { msg: "success" } : { msg: "error" });
         }
      }
   );
});

/*
app.delete("/", function(req, res) {
    res.send("Are you sure??? Ok, let’s delete a record");
    }); */

app.use(function (req, res) {
   res.status(404).send("Resource not found...");
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
   console.log("App started on port: " + port);
});