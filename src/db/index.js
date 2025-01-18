import mongoose from "mongoose";
import { dataBaseName } from "../constants.js";

const connectToDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${dataBaseName}`);
    console.log(`Connected to HOST:${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("MongoDB Connection Error", error);
    process.exit(1);
  }
}

export default connectToDB;