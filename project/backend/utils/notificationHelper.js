import { createNotification } from '../controllers/notificationController.js';
import User from '../models/User.js';
import BusinessIdea from '../models/BusinessIdea.js';

// Helper functions to create specific types of notifications

export const notifyInvestmentProposal = async (businessIdeaId, investorName, amount) => {
  try {
    const businessIdea = await BusinessIdea.findById(businessIdeaId).populate('userId');
    if (!businessIdea) return;

    await createNotification(
      businessIdea.userId._id,
      'INVESTMENT_PROPOSAL_RECEIVED',
      'New Investment Proposal',
      `${investorName} has made an investment proposal of $${amount.toLocaleString()} for your business idea "${businessIdea.title}"`,
      { businessIdeaId, investorName, amount },
      `/investments`,
      'high'
    );
  } catch (error) {
    console.error('Error creating investment proposal notification:', error);
  }
};

export const notifyProposalStatusUpdate = async (proposalId, investorId, status, businessIdeaTitle) => {
  try {
    const statusText = status === 'accepted' ? 'accepted' : 'rejected';
    const priority = status === 'accepted' ? 'high' : 'medium';

    await createNotification(
      investorId,
      `INVESTMENT_PROPOSAL_${status.toUpperCase()}`,
      `Investment Proposal ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
      `Your investment proposal for "${businessIdeaTitle}" has been ${statusText}`,
      { proposalId, status, businessIdeaTitle },
      `/investments`,
      priority
    );
  } catch (error) {
    console.error('Error creating proposal status notification:', error);
  }
};

export const notifyBusinessIdeaLike = async (businessIdeaId, likerName) => {
  try {
    const businessIdea = await BusinessIdea.findById(businessIdeaId).populate('userId');
    if (!businessIdea) return;

    await createNotification(
      businessIdea.userId._id,
      'BUSINESS_IDEA_LIKED',
      'Someone liked your idea!',
      `${likerName} liked your business idea "${businessIdea.title}"`,
      { businessIdeaId, likerName },
      `/business-ideas`,
      'low'
    );
  } catch (error) {
    console.error('Error creating like notification:', error);
  }
};

export const notifyNewBusinessIdea = async (businessIdeaId, businessPersonName, category) => {
  try {
    // Notify all investors about new business ideas in their interested categories
    const investors = await User.find({ role: 'investor', isActive: true });
    
    const businessIdea = await BusinessIdea.findById(businessIdeaId);
    if (!businessIdea) return;

    for (const investor of investors) {
      await createNotification(
        investor._id,
        'NEW_BUSINESS_IDEA',
        'New Business Opportunity',
        `${businessPersonName} posted a new ${category} business idea: "${businessIdea.title}"`,
        { businessIdeaId, category, businessPersonName },
        `/business-ideas`,
        'medium'
      );
    }
  } catch (error) {
    console.error('Error creating new business idea notifications:', error);
  }
};

export const notifyLoanApplication = async (loanOfferId, applicantName, amount) => {
  try {
    const loanOffer = await LoanOffer.findById(loanOfferId).populate('bankerId');
    if (!loanOffer) return;

    await createNotification(
      loanOffer.bankerId._id,
      'LOAN_APPLICATION_RECEIVED',
      'New Loan Application',
      `${applicantName} has applied for your loan offer of $${amount.toLocaleString()}`,
      { loanOfferId, applicantName, amount },
      `/loans`,
      'high'
    );
  } catch (error) {
    console.error('Error creating loan application notification:', error);
  }
};

export const notifyConsultationRequest = async (consultationId, clientName, topic) => {
  try {
    const consultation = await Consultation.findById(consultationId).populate('advisorId');
    if (!consultation) return;

    await createNotification(
      consultation.advisorId._id,
      'CONSULTATION_REQUEST',
      'New Consultation Request',
      `${clientName} has requested consultation on "${topic}"`,
      { consultationId, clientName, topic },
      `/consultations`,
      'medium'
    );
  } catch (error) {
    console.error('Error creating consultation request notification:', error);
  }
};

export const notifySystemAnnouncement = async (title, message, priority = 'medium') => {
  try {
    const users = await User.find({ isActive: true });
    
    for (const user of users) {
      await createNotification(
        user._id,
        'SYSTEM_ANNOUNCEMENT',
        title,
        message,
        {},
        null,
        priority
      );
    }
  } catch (error) {
    console.error('Error creating system announcement notifications:', error);
  }
};

export const notifySecurityAlert = async (userId, action, details) => {
  try {
    await createNotification(
      userId,
      'LOGIN_ALERT',
      'Security Alert',
      `${action} detected on your account. ${details}`,
      { action, details },
      `/profile`,
      'urgent'
    );
  } catch (error) {
    console.error('Error creating security alert notification:', error);
  }
};