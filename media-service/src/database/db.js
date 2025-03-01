import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}`
    );
    console.log(
      `MongoDB connection Successfull! MongoDB connected at host:${connectionInstance.connection.host}.Connected to Database: ${connectionInstance.connection.name}`
    );
  } catch (error) {
    console.log(`MongoDB connection error:  ${error}`);
  }
};
