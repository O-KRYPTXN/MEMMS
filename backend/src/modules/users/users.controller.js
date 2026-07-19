import { catchAsync } from '../../utils/catchAsync.js';
import * as userService from './users.service.js';
import * as userValidation from './users.validation.js';

/**
 * Helper to extract validation errors from Zod
 */
const formatZodErrors = (error) => {
  return error.errors.map(err => err.message).join(', ');
};

/**
 * @desc    Get all users (paginated)
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getUsers = catchAsync(async (req, res) => {
  const parsed = userValidation.queryUsersSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  const { page, limit, ...filters } = parsed.data;
  const result = await userService.getAllUsers(page, limit, filters);

  res.status(200).json(result);
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
export const getUser = catchAsync(async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ data: user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Create a new user (direct admin creation)
 * @route   POST /api/users
 * @access  Private (Admin)
 */
export const createUser = catchAsync(async (req, res) => {
  try {
    const parsed = userValidation.createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const newUser = await userService.createUser(parsed.data, req.user.id);
    res.status(201).json({
      message: 'User created successfully. An activation email has been sent.',
      data: newUser
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Update user details
 * @route   PATCH /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = catchAsync(async (req, res) => {
  try {
    const parsed = userValidation.updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const updatedUser = await userService.updateUser(req.params.id, parsed.data, req.user.id);
    res.status(200).json({
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Update user status (suspend/activate)
 * @route   PATCH /api/users/:id/status
 * @access  Private (Admin)
 */
export const updateUserStatus = catchAsync(async (req, res) => {
  try {
    const parsed = userValidation.updateUserStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const updatedUser = await userService.updateUserStatus(req.params.id, parsed.data, req.user.id);
    
    let actionMessage = 'Status updated';
    if (parsed.data.isSuspended === true) actionMessage = 'User suspended';
    if (parsed.data.isSuspended === false) actionMessage = 'User unsuspended';
    if (parsed.data.isActive === false) actionMessage = 'User deactivated';
    if (parsed.data.isActive === true) actionMessage = 'User activated';

    res.status(200).json({
      message: actionMessage,
      data: updatedUser
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});
