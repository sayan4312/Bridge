import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
export const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['business_person', 'investor', 'banker', 'business_advisor'])
    .withMessage('Invalid role specified'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Business Idea validation rules
export const validateBusinessIdea = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('category')
    .isIn(['Technology', 'Healthcare', 'Finance', 'Agriculture', 'Education', 'Manufacturing', 'Retail', 'Services', 'Other'])
    .withMessage('Invalid category'),
  body('investmentNeeded')
    .isNumeric()
    .isFloat({ min: 1000 })
    .withMessage('Investment needed must be at least $1,000'),
  handleValidationErrors
];

// Investment Proposal validation rules
export const validateInvestmentProposal = [
  body('businessIdeaId')
    .isMongoId()
    .withMessage('Invalid business idea ID'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 1000 })
    .withMessage('Investment amount must be at least $1,000'),
  body('type')
    .isIn(['equity', 'loan', 'partnership'])
    .withMessage('Invalid investment type'),
  body('terms')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Terms must be between 10 and 1000 characters'),
  body('equityPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Equity percentage must be between 0 and 100'),
  body('interestRate')
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage('Interest rate must be between 0 and 50'),
  body('loanDuration')
    .optional()
    .isInt({ min: 1, max: 360 })
    .withMessage('Loan duration must be between 1 and 360 months'),
  handleValidationErrors
];

// Loan Offer validation rules
export const validateLoanOffer = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  body('amount')
    .isNumeric()
    .isFloat({ min: 1000 })
    .withMessage('Loan amount must be at least $1,000'),
  body('interestRate')
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Interest rate must be between 0.1 and 50'),
  body('duration')
    .isInt({ min: 1, max: 360 })
    .withMessage('Duration must be between 1 and 360 months'),
  body('conditions')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Conditions must be between 10 and 2000 characters'),
  handleValidationErrors
];

// Consultation validation rules
export const validateConsultation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Title must be between 5 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 20, max: 2000 })
    .withMessage('Description must be between 20 and 2000 characters'),
  body('advice')
    .trim()
    .isLength({ min: 10, max: 3000 })
    .withMessage('Advice must be between 10 and 3000 characters'),
  body('category')
    .isIn(['Strategy', 'Marketing', 'Finance', 'Operations', 'Technology', 'Legal', 'HR', 'Sales', 'Other'])
    .withMessage('Invalid category'),
  body('businessIdeaId')
    .optional()
    .isMongoId()
    .withMessage('Invalid business idea ID'),
  handleValidationErrors
];

// MongoDB ObjectId validation
export const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

// Message validation rules
export const validateMessage = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message content must be between 1 and 1000 characters'),
  body('messageType')
    .optional()
    .isIn(['text', 'file', 'system'])
    .withMessage('Invalid message type'),
  handleValidationErrors
];