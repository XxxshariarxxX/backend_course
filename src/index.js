import dotenv from "dotenv";
import connectToDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});

connectToDB()
.then(() => {
  app.listen(process.env.PORT || 8000, () => {
    console.log(`app is listening on port ${process.env.PORT}`);
  });
})
.catch((error) => {
  console.log("MONGODB CONNECTION FAILED!!", error);
});













/*
import express from "express";
const app = express();
(async()=>{
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${dataBaseName}`)
    app.on("error", (error) => {
      console.error("ERROR", error)
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log(`app is listening on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("ERROR",error);
    throw error;
  }
})()
*/