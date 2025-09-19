import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { useBusinessStore } from '../store/businessStore';
import {
  MessageSquare,
  Send,
  MoreVertical,
  Trash2,
  ArrowLeft,
  Clock,
  User,
  Building2,
  DollarSign,
  TrendingUp,
  X,
  ChevronDown,
  ChevronUp,
  Paperclip,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';

const Chat = () => {
  const { user, isAuthenticated } = useAuthStore();
  const {
    chatRooms,
    selectedChatRoom,
    messages,
    typingUsers,
    onlineUsers,
    fetchChatRooms,
    selectChatRoom,
    sendMessage,
    deleteMessage,
    initializeSocket,
    disconnectSocket,
    setupTypingIndicator,
    clearErrors,
    reset,
    fetchAndSelectChatRoomById,
    uploadFileToChat
  } = useChatStore();
  const { investmentProposals, fetchInvestmentProposals } = useBusinessStore();
  const { id: chatRoomIdParam } = useParams();

  const [messageInput, setMessageInput] = useState('');
  const [showCreateChat, setShowCreateChat] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      const initChat = async () => {
        try {
          await initializeSocket();
          fetchChatRooms();
          fetchInvestmentProposals();
        } catch (error) {
          console.error('Failed to initialize chat:', error);
          // Still fetch chat rooms even if socket fails
          fetchChatRooms();
          fetchInvestmentProposals();
        }
      };
      initChat();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, user, initializeSocket, fetchChatRooms, fetchInvestmentProposals, disconnectSocket]);

  useEffect(() => {
    clearErrors();
  }, [clearErrors]);

  // Auto-select chat room if URL param is present
  useEffect(() => {
    if (chatRoomIdParam && chatRooms.length > 0) {
      const found = chatRooms.find(room => room._id === chatRoomIdParam);
      if (found && (!selectedChatRoom || selectedChatRoom._id !== found._id)) {
        selectChatRoom(found);
      } else if (!found) {
        fetchAndSelectChatRoomById(chatRoomIdParam);
      }
    } else if (chatRoomIdParam && chatRooms.length === 0) {
      // If chatRooms not loaded yet, try to fetch after they load
      fetchAndSelectChatRoomById(chatRoomIdParam);
    }
  }, [chatRoomIdParam, chatRooms, selectChatRoom, selectedChatRoom, fetchAndSelectChatRoomById]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedChatRoom) return;

    const success = await sendMessage(selectedChatRoom._id, {
      content: messageInput.trim(),
      messageType: 'text'
    });

    if (success) {
      setMessageInput('');
    }
  };

  const handleCreateChat = async () => {
    if (!selectedProposal) {
      toast.error('Please select a proposal');
      return;
    }

    const success = await useChatStore.getState().createChatRoomFromProposal({
      investmentProposalId: selectedProposal
    });

    if (success) {
      setShowCreateChat(false);
      setSelectedProposal('');
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    
    if (selectedChatRoom && user) {
      setupTypingIndicator(selectedChatRoom._id, user.id, user.name);
    }
  };

  const getOtherParticipant = (chatRoom: any) => {
    if (!user || !chatRoom?.participants) return null;
    return chatRoom.participants.find((p: any) => p && p._id !== user.id) || null;
  };

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const isUserTyping = (userId: string) => {
    return typingUsers.has(userId);
  };

  const formatLastMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Please log in to access chat</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Chat Rooms Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Messages</h1>
            <button
              onClick={() => setShowCreateChat(true)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Rooms List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
          {chatRooms.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No chat rooms yet</p>
              <p className="text-sm">Start a conversation from an investment proposal</p>
            </div>
          ) : (
            chatRooms.map((room) => {
              const otherParticipant = getOtherParticipant(room);
              const isSelected = selectedChatRoom?._id === room._id;
              
              return (
                <motion.div
                  key={room._id}
                  whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.02)' }}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 cursor-pointer ${
                    isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => selectChatRoom(room)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {otherParticipant?.name?.charAt(0) || 'U'}
                      </div>
                      {isUserOnline(otherParticipant?._id) && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {otherParticipant?.name || 'Unknown'}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {room.lastMessage && formatLastMessageTime(room.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {room.businessIdeaId?.title || 'No Title'}
                      </p>
                      
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {(room.lastMessage.senderId?.name || 'Unknown') + ': ' + (room.lastMessage.content || '')}
                        </p>
                      )}
                      
                      {room.unreadCount > 0 && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {room.unreadCount} new
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col">
        {selectedChatRoom ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                {/* Left: Back and user info */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => selectChatRoom(null)}
                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {getOtherParticipant(selectedChatRoom)?.name?.charAt(0) || 'U'}
                    </div>
                    {isUserOnline(getOtherParticipant(selectedChatRoom)?._id) && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 dark:text-white">
                      {getOtherParticipant(selectedChatRoom)?.name || 'Unknown'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {isUserOnline(getOtherParticipant(selectedChatRoom)?._id) ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>
                {/* Center: Title */}
                <div className="flex-1 text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {selectedChatRoom.businessIdeaId?.title || 'No Title'}
                  </p>
                </div>
                {/* Right: Amount and delete */}
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedChatRoom.investmentProposalId?.amount !== undefined ? `$${selectedChatRoom.investmentProposalId.amount.toLocaleString()}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="ml-4 p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200 rounded-full transition-colors"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Project Details Panel */}
            {selectedChatRoom.businessIdeaId && (
              <div className="relative bg-gradient-to-br from-white/90 to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 px-8 py-5 shadow-sm rounded-b-2xl mb-2 flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-8 h-8 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6.75v-1.5a2.25 2.25 0 10-4.5 0v1.5m-2.25 0h9a2.25 2.25 0 012.25 2.25v8.25a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25V9a2.25 2.25 0 012.25-2.25zm0 0V5.25A4.125 4.125 0 0112 1.125a4.125 4.125 0 014.125 4.125v1.5" /></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-1 tracking-tight">
                    {selectedChatRoom.businessIdeaId.title}
                  </h3>
                  <CollapsibleDescription desc={selectedChatRoom.businessIdeaId.description} />
                  <div className="flex flex-wrap gap-3 mt-2 text-sm">
                    <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" /></svg>
                      {selectedChatRoom.businessIdeaId.category}
                    </span>
                    <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium">
                      <DollarSign className="w-4 h-4" />
                      Investment Needed: ${selectedChatRoom.businessIdeaId.investmentNeeded?.toLocaleString()}
                    </span>
                  </div>
                  <InvestmentProposalDetails proposal={selectedChatRoom.investmentProposalId} />
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
              <AnimatePresence>
                {messages.map((message) => {
                  const isOwnMessage = message.senderId._id === user?.id;
                  const isFile = message.messageType === 'file';
                  return (
                    <motion.div
                      key={message._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div className={`rounded-lg px-4 py-2 ${
                          isOwnMessage 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}>
                          {isFile ? (
                            <a
                              href={message.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 dark:text-blue-300 hover:underline"
                              download={message.fileName}
                            >
                              {message.fileUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <ImageIcon className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                              <span className="truncate max-w-[120px]">{message.fileName || message.content}</span>
                            </a>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                          <div className={`flex items-center justify-between mt-1 ${
                            isOwnMessage ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            <span className="text-xs">
                              {format(new Date(message.createdAt), 'HH:mm')}
                            </span>
                            {isOwnMessage && (
                              <button
                                onClick={() => deleteMessage(message._id)}
                                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {Array.from(typingUsers).map(userId => {
                        const participant = selectedChatRoom.participants.find(p => p._id === userId);
                        return participant?.name || 'Unknown';
                      }).join(', ')} is typing...
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <form onSubmit={handleSendMessage} className="flex space-x-2 items-center">
                {/* File upload button */}
                <button
                  type="button"
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                  disabled={uploading}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedChatRoom) return;
                    setUploading(true);
                    const success = await uploadFileToChat(selectedChatRoom._id, file);
                    setUploading(false);
                    if (success) {
                      toast.success('File sent');
                    }
                    e.target.value = '';
                  }}
                  accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  disabled={uploading}
                />
                <input
                  type="text"
                  value={messageInput}
                  onChange={handleTyping}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  disabled={uploading}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || uploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                </button>
                {uploading && <span className="ml-2 text-xs text-blue-500">Uploading...</span>}
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-400">Select a chat to start messaging</h2>
              <p className="text-gray-500 dark:text-gray-500 mt-2">Choose from your existing conversations</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Chat Modal */}
      {showCreateChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Chat
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Investment Proposal
                </label>
                <select
                  value={selectedProposal}
                  onChange={(e) => setSelectedProposal(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Choose a proposal...</option>
                  {investmentProposals.map((proposal) => (
                    <option key={proposal._id} value={proposal._id}>
                      {proposal.businessIdeaId?.title || (`$${proposal.amount.toLocaleString()} - ${proposal.type}`)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowCreateChat(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateChat}
                  disabled={!selectedProposal}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Chat
                </h2>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <p className="mb-6 text-gray-700 dark:text-gray-300">
                Are you sure you want to delete this chat? This will delete all messages in this chat room for all participants.
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!selectedChatRoom) return;
                    await useChatStore.getState().deleteChatRoom(selectedChatRoom._id);
                    setShowDeleteModal(false);
                  }}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// CollapsibleDescription component
const CollapsibleDescription = ({ desc, label }: { desc: string, label?: string }) => {
  const [expanded, setExpanded] = React.useState(false);
  if (!desc) return null;
  const isLong = desc.length > 120;
  return (
    <div className="text-gray-700 dark:text-gray-300 text-sm mb-1">
      {label && <span className="font-semibold text-gray-800 dark:text-gray-200 mr-1">{label}:</span>}
      {isLong && !expanded ? (
        <>
          {desc.slice(0, 120)}...{' '}
          <button className="inline-flex items-center text-blue-600 dark:text-blue-400 underline" onClick={() => setExpanded(true)}>
            <ChevronDown className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          {desc} {isLong && (
            <button className="inline-flex items-center text-blue-600 dark:text-blue-400 underline" onClick={() => setExpanded(false)}>
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </>
      )}
    </div>
  );
};

// InvestmentProposalDetails component
const InvestmentProposalDetails = ({ proposal }: { proposal: any }) => {
  if (!proposal) return null;
  const { amount, type, status, terms, equityPercentage, interestRate, loanDuration } = proposal;
  return (
    <div className="mt-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
      <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-2 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-green-500" /> Investment Proposal
      </h4>
      <div className="flex flex-wrap gap-4 text-sm mb-2">
        <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full font-medium">
          <DollarSign className="w-4 h-4" />
          Amount: ${amount?.toLocaleString()}
        </span>
        <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full font-medium">
          {type?.charAt(0).toUpperCase() + type?.slice(1)}
        </span>
        <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full font-medium">
          Status: {status?.charAt(0).toUpperCase() + status?.slice(1)}
        </span>
        {equityPercentage && (
          <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
            Equity: {equityPercentage}%
          </span>
        )}
        {interestRate && (
          <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full font-medium">
            Interest: {interestRate}%
          </span>
        )}
        {loanDuration && (
          <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-3 py-1 rounded-full font-medium">
            Duration: {loanDuration} mo
          </span>
        )}
      </div>
      {terms && (
        <CollapsibleDescription desc={terms} label="Terms" />
      )}
    </div>
  );
};

export default Chat; 