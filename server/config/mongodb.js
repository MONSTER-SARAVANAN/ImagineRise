import mongoose from "mongoose";

const connectDB = async () => {
	try {
		await mongoose.connect(process.env.MONGODB_URI, {
			dbName: "imaginerise", // Use dbName option instead of hardcoding in URI
		});

		console.log("✅ MongoDB connected:", mongoose.connection.host);
	} catch (error) {
		console.error("❌ MongoDB connection failed:", error.message);
		process.exit(1); // Exit process if DB connection fails
	}
};

export default connectDB;
