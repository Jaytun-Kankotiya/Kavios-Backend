import mongoose from "mongoose";

const initializeDatabase = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    if (connection) {
      console.log("Connected to Database");
    }else{
        console.log("Error Connecting Database")
    }
  } catch (error) {
    console.error("Error connecting to Database", error);
  }
};

export default initializeDatabase;
