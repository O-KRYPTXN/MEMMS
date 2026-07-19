import { catchAsync } from '../../utils/catchAsync.js';
import * as registrationService from './registration.service.js';
import * as registrationValidation from './registration.validation.js';

const formatZodErrors = (error) => {
  return error.errors.map(err => err.message).join(', ');
};

/**
 * @desc    Get all registration requests (paginated)
 * @route   GET /api/registrations
 * @access  Private (Admin)
 */
export const getRequests = catchAsync(async (req, res) => {
  const parsed = registrationValidation.queryRegistrationsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  const { page, limit, ...filters } = parsed.data;
  const result = await registrationService.getRegistrationRequests(page, limit, filters);

  res.status(200).json(result);
});

/**
 * @desc    Approve a pending registration request
 * @route   POST /api/registrations/:id/approve
 * @access  Private (Admin)
 */
export const approveRegistration = catchAsync(async (req, res) => {
  try {
    const newUser = await registrationService.approveRegistration(req.params.id);
    
    res.status(200).json({ 
      message: 'Registration approved and activation email sent',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Reject a pending registration request
 * @route   POST /api/registrations/:id/reject
 * @access  Private (Admin)
 */
export const rejectRegistration = catchAsync(async (req, res) => {
  try {
    const parsed = registrationValidation.rejectRegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    await registrationService.rejectRegistration(req.params.id, parsed.data.reason);

    res.status(200).json({ 
      message: 'Registration request denied and notification email sent'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});
