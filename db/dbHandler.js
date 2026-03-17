// db/dbHandler.js
const fs = require("fs");
const path = require("path");
const config = require("../configs/config");

const ensureDBFolder = () => {
  if (!fs.existsSync(config.dbFolder)) fs.mkdirSync(config.dbFolder);
};

const getCollectionFile = (dbName, collectionName) => {
  const dbPath = path.join(config.dbFolder, dbName);
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath);
  const filePath = path.join(dbPath, `${collectionName}.json`);
  if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify([]));
  return filePath;
};

const readCollection = (dbName, collectionName) => {
  const filePath = getCollectionFile(dbName, collectionName);
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
};

const writeCollection = (dbName, collectionName, data) => {
  const filePath = getCollectionFile(dbName, collectionName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

module.exports = { ensureDBFolder, readCollection, writeCollection };
