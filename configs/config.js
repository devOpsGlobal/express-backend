require("dotenv").config();

const config = Object.freeze({
  port: process.env.PORT || 8000,
  wsPort : process.env.WS_PORT || 8080,
  databaseURI:
    process.env.MONGODB_URI ||
    "mongodb+srv://mrnoukhan7377:MyDB123@mydb.eymfa.mongodb.net/restaurant",
  nodeEnv: process.env.NODE_ENV || "development",
  accessTokenSecret: process.env.JWT_SECRET,
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [],
});

module.exports = config;
