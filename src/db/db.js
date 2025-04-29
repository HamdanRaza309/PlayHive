import mongoose from "mongoose";
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        // console.log(connectionInstance);
        console.log(`Connected to MongoDB! DB-Host: ${connectionInstance.connection._connectionString}`);
        console.log(`Connected to MongoDB! DB-Host: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log("MongoDB connection Failed", error);
        process.exit(1); // Exit process with failure
    }
}

export default connectDB;