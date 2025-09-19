import ChatRoom from '../models/ChatRoom.js';
import Message from '../models/Message.js';
import BusinessIdea from '../models/BusinessIdea.js';
import InvestmentProposal from '../models/InvestmentProposal.js';
import ActivityLog from '../models/ActivityLog.js';
import { createNotification } from './notificationController.js';

// @desc    Get user's chat rooms
// @route   GET /api/chat/rooms
// @access  Private
export const getUserChatRooms = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const chatRooms = await ChatRoom.find({
      participants: userId,
      isActive: true
    }).sort({ updatedAt: -1 });

    // Get unread counts for each room
    const roomsWithUnreadCounts = await Promise.all(
      chatRooms.map(async (room) => {
        const unreadCount = await Message.getUnreadCount(room._id, userId);
        const roomObj = room.toObject();
        roomObj.unreadCount = unreadCount;
        return roomObj;
      })
    );

    res.status(200).json({
      success: true,
      count: roomsWithUnreadCounts.length,
      data: { chatRooms: roomsWithUnreadCounts }
    });
  } catch (error) {
    console.error('❌ Error fetching chat rooms:', error.message);
    next(error);
  }
};

// @desc    Get single chat room with messages
// @route   GET /api/chat/rooms/:id
// @access  Private
export const getChatRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is participant in this chat room
    const chatRoom = await ChatRoom.findOne({
      _id: id,
      participants: userId,
      isActive: true
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied'
      });
    }

    // Get messages for this room
    const messages = await Message.find({ chatRoomId: id })
      .sort({ createdAt: 1 })
      .limit(50); // Limit to last 50 messages

    // Mark messages as read for this user
    await Message.markAllAsRead(id, userId);
    await chatRoom.markAsRead(userId);

    res.status(200).json({
      success: true,
      data: { 
        chatRoom,
        messages,
        unreadCount: 0 // Reset to 0 since we just marked as read
      }
    });
  } catch (error) {
    console.error('❌ Error fetching chat room:', error.message);
    next(error);
  }
};

// @desc    Send message
// @route   POST /api/chat/rooms/:id/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.user._id;

    // Validate chat room access
    const chatRoom = await ChatRoom.findOne({
      _id: id,
      participants: userId,
      isActive: true
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found or access denied'
      });
    }

    // Create message
    const message = await Message.create({
      chatRoomId: id,
      senderId: userId,
      content,
      messageType
    });

    await message.populate('senderId', 'name email role avatar');

    // Update chat room's last message
    chatRoom.lastMessage = {
      content: message.content,
      senderId: message.senderId._id,
      timestamp: message.createdAt
    };

    // Increment unread count for other participants
    const otherParticipants = chatRoom.participants.filter(
      p => p.toString() !== userId.toString()
    );

    for (const participantId of otherParticipants) {
      const id = participantId._id ? participantId._id : participantId;
      await chatRoom.incrementUnread(id.toString());
    }

    await chatRoom.save();

    // Log activity
    await ActivityLog.logActivity(
      userId,
      'MESSAGE_SENT',
      'Message',
      message._id,
      { chatRoomId: id, contentLength: content.length },
      req
    );

    // Create notification for other participants
    for (const participantId of otherParticipants) {
      await createNotification(
        participantId,
        'NEW_MESSAGE',
        'New Message',
        `You have a new message from ${req.user.name}`,
        { 
          chatRoomId: id,
          messageId: message._id,
          senderName: req.user.name
        },
        `/chat/${id}`,
        'medium',
        req
      );
    }

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.to(id).emit('new_message', {
        message: message.toObject(),
        chatRoomId: id
      });
    }

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
    next(error);
  }
};

// @desc    Create chat room from investment proposal
// @route   POST /api/chat/create-from-proposal
// @access  Private
export const createChatRoomFromProposal = async (req, res, next) => {
  try {
    const { investmentProposalId } = req.body;
    const userId = req.user._id;

    // Get investment proposal
    const proposal = await InvestmentProposal.findById(investmentProposalId)
      .populate('businessIdeaId', 'userId title');

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Investment proposal not found'
      });
    }

    // Check if user is authorized (investor or business owner)
    // Always compare to the _id field, whether populated or not
    const businessOwnerId = proposal.businessIdeaId.userId._id ? proposal.businessIdeaId.userId._id : proposal.businessIdeaId.userId;
    const investorId = proposal.investorId._id ? proposal.investorId._id : proposal.investorId;

    if (userId.toString() !== investorId.toString() && 
        userId.toString() !== businessOwnerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this proposal'
      });
    }

    // Find or create chat room
    const chatRoom = await ChatRoom.findOrCreateChatRoom(
      investorId,
      businessOwnerId,
      proposal.businessIdeaId._id,
      proposal._id
    );

    await chatRoom.populate([
      { path: 'participants', select: 'name email role avatar' },
      { path: 'businessIdeaId', select: 'title description category investmentNeeded' },
      { path: 'investmentProposalId', select: 'amount type status' }
    ]);

    res.status(200).json({
      success: true,
      data: { chatRoom }
    });
  } catch (error) {
    console.error('❌ Error creating chat room from proposal:', error.message);
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/rooms/:id/read
// @access  Private
export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if user is participant
    const chatRoom = await ChatRoom.findOne({
      _id: id,
      participants: userId
    });

    if (!chatRoom) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found'
      });
    }

    // Mark all messages as read
    await Message.markAllAsRead(id, userId);
    await chatRoom.markAsRead(userId);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error.message);
    next(error);
  }
};

// @desc    Get unread message count
// @route   GET /api/chat/unread-count
// @access  Private
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Get all user's chat rooms
    const chatRooms = await ChatRoom.find({
      participants: userId,
      isActive: true
    });

    // Calculate total unread count
    let totalUnread = 0;
    for (const room of chatRooms) {
      const unreadCount = await Message.getUnreadCount(room._id, userId);
      totalUnread += unreadCount;
    }

    res.status(200).json({
      success: true,
      data: { unreadCount: totalUnread }
    });
  } catch (error) {
    console.error('❌ Error getting unread count:', error.message);
    next(error);
  }
};

// @desc    Delete message (only sender can delete)
// @route   DELETE /api/chat/messages/:id
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.senderId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(message.chatRoomId.toString()).emit('message_deleted', {
        messageId: id,
        chatRoomId: message.chatRoomId
      });
    }

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting message:', error.message);
    next(error);
  }
}; 

// @desc    Delete chat room and all its messages
// @route   DELETE /api/chat/rooms/:id
// @access  Private
export const deleteChatRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    // Find chat room and check if user is a participant
    const chatRoom = await ChatRoom.findOne({ _id: id, participants: userId });
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: 'Chat room not found or access denied' });
    }

    // Delete all messages in this chat room
    await Message.deleteMany({ chatRoomId: id });
    // Delete the chat room
    await chatRoom.deleteOne();

    // Optionally, emit a socket event for chat room deletion (not implemented here)

    res.status(200).json({ success: true, message: 'Chat room and messages deleted' });
  } catch (error) {
    console.error('❌ Error deleting chat room:', error.message);
    next(error);
  }
}; 

// @desc    Handle chat file upload and create file message
// @route   POST /api/chat/rooms/:id/upload
// @access  Private
export const uploadChatFileHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Validate chat room access
    const chatRoom = await ChatRoom.findOne({ _id: id, participants: userId, isActive: true });
    if (!chatRoom) {
      return res.status(404).json({ success: false, message: 'Chat room not found or access denied' });
    }
    // Create file message
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const message = await Message.create({
      chatRoomId: id,
      senderId: userId,
      content: req.file.originalname,
      messageType: 'file',
      fileUrl,
      fileName: req.file.originalname,
      isRead: false
    });
    await message.populate('senderId', 'name email role avatar');
    // Update chat room's last message
    chatRoom.lastMessage = {
      content: message.content,
      senderId: message.senderId._id,
      timestamp: message.createdAt
    };
    // Increment unread count for other participants
    const otherParticipants = chatRoom.participants.filter(p => p.toString() !== userId.toString());
    for (const participantId of otherParticipants) {
      const id = participantId._id ? participantId._id : participantId;
      await chatRoom.incrementUnread(id.toString());
    }
    await chatRoom.save();
    // Emit socket event for real-time updates (optional)
    const io = req.app.get('io');
    if (io) {
      io.to(chatRoom._id.toString()).emit('new_message', { message: message.toObject(), chatRoomId: chatRoom._id });
    }
    res.status(201).json({ success: true, data: { message } });
  } catch (error) {
    console.error('❌ Error uploading chat file:', error.message);
    next(error);
  }
}; 