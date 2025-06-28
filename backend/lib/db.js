import mongoose from 'mongoose';
import "dotenv/config";


export const connectDB=async ()=>
{
    try
    {
        const conn=await mongoose.connect(process.env.MONGO_URI);
        console.log(`\nMongoDB connected: ${conn.connection.host}\n`);
    }
    catch(error)
    {
        console.log("\nError connecting to MongoDB",error.message,"\n");
        process.exit(1);
    }
}