import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InvestmentProposal from '../models/InvestmentProposal.js';
import ChatRoom from '../models/ChatRoom.js';
import BusinessIdea from '../models/BusinessIdea.js';
import User from '../models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database contents...\n');

    // Check Users
    const userCount = await User.countDocuments();
    console.log(`👥 Users: ${userCount}`);

    // Check Business Ideas
    const businessIdeaCount = await BusinessIdea.countDocuments();
    console.log(`💡 Business Ideas: ${businessIdeaCount}`);

    // Check Investment Proposals
    const proposalCount = await InvestmentProposal.countDocuments();
    console.log(`📋 Investment Proposals: ${proposalCount}`);

    // Check Chat Rooms
    const chatRoomCount = await ChatRoom.countDocuments();
    console.log(`💬 Chat Rooms: ${chatRoomCount}`);

    console.log('\n📊 Detailed Information:');

    if (proposalCount > 0) {
      console.log('\n📋 Investment Proposals:');
      const proposals = await InvestmentProposal.find({})
        .populate('businessIdeaId', 'title')
        .populate('investorId', 'name email')
        .populate('businessIdeaId.userId', 'name email');

      proposals.forEach((proposal, index) => {
        console.log(`  ${index + 1}. ${proposal.businessIdeaId?.title || 'Unknown Idea'}`);
        console.log(`     Investor: ${proposal.investorId?.name || 'Unknown'} (${proposal.investorId?.email || 'No email'})`);
        console.log(`     Amount: $${proposal.amount?.toLocaleString() || 'Unknown'}`);
        console.log(`     Status: ${proposal.status}`);
        console.log(`     Created: ${proposal.createdAt}`);
        console.log('');
      });
    }

    if (chatRoomCount > 0) {
      console.log('\n💬 Chat Rooms:');
      const chatRooms = await ChatRoom.find({})
        .populate('participants', 'name email')
        .populate('businessIdeaId', 'title')
        .populate('investmentProposalId', 'amount type');

      chatRooms.forEach((room, index) => {
        console.log(`  ${index + 1}. Chat Room ID: ${room._id}`);
        console.log(`     Business: ${room.businessIdeaId?.title || 'Unknown'}`);
        console.log(`     Participants: ${room.participants.map(p => p.name).join(', ')}`);
        console.log(`     Proposal Amount: $${room.investmentProposalId?.amount?.toLocaleString() || 'Unknown'}`);
        console.log(`     Created: ${room.createdAt}`);
        console.log('');
      });
    }

    // Check for proposals without chat rooms
    if (proposalCount > 0 && chatRoomCount === 0) {
      console.log('\n⚠️  WARNING: Found investment proposals but no chat rooms!');
      console.log('This suggests the chat room creation might not be working properly.');
      
      const proposals = await InvestmentProposal.find({})
        .populate('businessIdeaId', 'title userId')
        .populate('investorId', 'name email');

      console.log('\n📋 Proposals without chat rooms:');
      proposals.forEach((proposal, index) => {
        console.log(`  ${index + 1}. ${proposal.businessIdeaId?.title || 'Unknown Idea'}`);
        console.log(`     Investor: ${proposal.investorId?.name || 'Unknown'}`);
        console.log(`     Business Owner: ${proposal.businessIdeaId?.userId?.name || 'Unknown'}`);
        console.log(`     Amount: $${proposal.amount?.toLocaleString() || 'Unknown'}`);
        console.log(`     Status: ${proposal.status}`);
        console.log('');
      });
    }

    // Disconnect from database
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');

  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await checkDatabase();
};

runScript(); 