import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Validate MongoDB URI
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error(
        '❌ MONGO_URI environment variable is not defined!\n' +
        '📝 Please create a .env file in the backend directory.\n' +
        '📋 Copy .env.example to .env and update the MONGO_URI value.\n' +
        '🔗 Example: MONGO_URI=mongodb://localhost:27017/bridge'
      );
    }

    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')); // Hide password in logs
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Handle MongoDB events
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🛑 MongoDB connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('➡️ Error message:', error.message);
    
    if (error.message.includes('MONGO_URI environment variable is not defined')) {
      console.error('\n�️ SETUP INSTRUCTIONS:');
      console.error('1. Copy .env.example to .env in the backend directory');
      console.error('2. Update MONGO_URI in .env with your MongoDB connection string');
      console.error('3. For local development: mongodb://localhost:27017/bridge');
      console.error('4. For MongoDB Atlas: get connection string from your cluster\n');
    } else {
      console.error('�📌 Stack trace:', error.stack);
    }
    
    process.exit(1);
  }
};

export default connectDB;
