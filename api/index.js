import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { GridFSBucket, MongoClient } from "mongodb";

let DATABASE_NAME = "cs193x_finalproject";
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";

const api = express.Router();
let conn = null;
let db = null;
let Galleries = null;
let bucket = null;

const initApi = async app => {
  app.set("json spaces", 2);
  app.use("/api", api);

  // initialize database connection
  conn = await MongoClient.connect(MONGODB_URL);
  db = conn.db(DATABASE_NAME);
  Galleries = db.collection("galleries");
  bucket = new GridFSBucket(db);
};

const saveFile = async (bucket, name, data) => {
  let existing = await bucket.find({ filename: name }).toArray();
  if (existing.length) throw new Error(`File ${name} already exists`);
  let stream;
  try {
    stream = bucket.openUploadStream(name);
  } catch(e) {
    throw new Error("Error uploading file");
  }
  return new Promise(resolve => stream.end(data, () => resolve(stream.id)));
};

const readFile = async (bucket, name) => {
  let stream = bucket.openDownloadStreamByName(name);
  let chunks = [];
  return new Promise(resolve => {
    stream.on("data", chunk => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
};

const deleteFile = async (bucket, name) => {
  let arr = await bucket.find({ filename: name }).toArray();
  for (let f of arr) await bucket.delete(f._id);
};

api.use(bodyParser.json({ limit: "100mb" }));
api.use(cors());

api.get("/", (req, res) => {
  res.json({ db: DATABASE_NAME });
});

/* GET /galleries: return all galleries with their data */
api.get("/galleries", async (req, res) => {
  let galleries = await Galleries.find().toArray();
  res.json({ galleries });
});

/* POST /galleries: make new gallery with given data */
api.post("/galleries", async (req, res) => {
  let data = req.body;
  if (!data.title) {
    res.status(400).json({ error: "Please put at least one character in the gallery name" });
    return;
  } else if (data.title.includes("?") || data.title.includes("#") || data.title.includes("/")) {
    res.status(400).json({ error: "Cannot have ?, #, or / in the gallery name" });
    return;
  } else if (await Galleries.findOne({ title: data.title })) {
    res.status(400).json({ error: `Gallery "${data.title}" already exists` });
    return;
  }

  await Galleries.insertOne(data);
  delete data._id;
  res.json( data );
});

/* middleware function for /galleries/:title */
api.use("/galleries/:title", async (req, res, next) => {
  let title = req.params.title;
  let gallery = await Galleries.findOne({ title: title });
  if (!gallery) {
    res.status(404).json({ error: `No gallery with name "${title}"` });
    return;
  } 

  res.locals.gallery = gallery;
  next();
});

/* GET /galleries/:title: return data for gallery with given title */
api.get("/galleries/:title", async (req, res) => {
  let gallery = res.locals.gallery;
  delete gallery._id;
  res.json( gallery );
})

/* PATCH /galleries/:title: change gallery name */
api.patch("/galleries/:title", async (req, res) => {
  let gallery = res.locals.gallery;
  let items = gallery.items;
  let update = req.body;

  if (!update.title) {
    res.status(400).json({ error: "Please put at least one character in the gallery name" });
    return;
  } else if (update.title.includes("?") || update.title.includes("#") || update.title.includes("/")) {
    res.status(400).json({ error: "Cannot have ?, #, or / in the gallery name" });
    return;
  } else if (await Galleries.findOne({ title: update.title })) {
    res.status(400).json({ error: `Gallery "${update.title}" already exists` });
    return;
  }

  await Galleries.replaceOne({ title: gallery.title }, update);
  // need to delete/save each item in the gallery because of how the file names in the bucket are defined
  for (let i = 0; i < items.length; i++) {
    let item = items[i];
    let path = await readFile(bucket, gallery.title + item.title);
    await deleteFile(bucket, gallery.title + item.title);
    update.items[i].path = await saveFile(bucket, update.title + item.title, path);
  }

  delete update._id;
  res.json( update );
});

/* DELETE /galleries/:title/: delete gallery */
api.delete("/galleries/:title", async (req, res) => {
  let gallery = res.locals.gallery;
  let items = gallery.items;

  Galleries.deleteOne({ title: gallery.title });
  // delete all items from bucket
  for (let item of items) {
    await deleteFile(bucket, gallery.title + item.title);
  }
  res.json({ success: true });
});

/* PATCH /galleries/:title/content: edit content of gallery */
api.patch("/galleries/:title/content", async (req, res) => {
  let gallery = res.locals.gallery;
  let update = req.body;

  await Galleries.replaceOne({ title: gallery.title }, update);
  delete update._id;
  res.json( update );
});

/* DELETE /galleries/:title/:item: delete item from gallery with given title */
api.delete("/galleries/:title/:item", async (req, res) => {
  let gallery = res.locals.gallery;
  let items = gallery.items;
  let itemTitle = req.params.item;

  let index = items.findIndex(x => x.title === itemTitle);
  if (index === undefined) {
    res.status(404).json({ error: `Item with title "${itemTitle}" does not exist` });
    return;
  }

  await deleteFile(bucket, gallery.title + itemTitle);
  items.splice(index, 1);
  Galleries.updateOne({ title: gallery.title }, { $set: { items: items } });
  res.json({ success: true });
});

/* GET /galleries/:title/items: return data of items in gallery with given title */
api.get("/galleries/:title/items", async (req, res) => {
  let gallery = res.locals.gallery;
  let items = gallery.items;

  for (let item of items) {
    item.path = await readFile(bucket, gallery.title + item.title);
  }
  res.json({ items });
});

/* POST /galleries/:title/items: add item to gallery with given title */
api.post("/galleries/:title/items", async (req, res) => {
  let gallery = res.locals.gallery;
  let data = req.body;
  let items = gallery.items;

  if (!data.title) {
    res.status(400).json({ error: "Please put at least one character in the item name" });
    return;
  } else if (data.title.includes("?") || data.title.includes("#") || data.title.includes("/")) {
    res.status(400).json({ error: "Cannot have ?, #, or / in the item name" });
    return;
  } else if (items.some(item => item.title === data.title)) {
    res.status(400).json({ error: `Item "${data.title}" already exists` });
    return;
  }

  data.path = await saveFile(bucket, gallery.title + data.title, data.path);
  items.push(data);
  Galleries.updateOne({ title: gallery.title }, { $set: { items: items } });
  res.json({ success: true });
});

/* catch-all route to return a JSON error if endpoint not defined */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});

export default initApi;
