import { loginSchema, signupSchema, updateProfileSchema, changePasswordSchema } from './auth.validation.js';
import { generateTokenAndSetCookie, mapFrontendRoleToEnum } from './auth.utils.js';
import * as authService from './auth.service.js';

/**
 * Helper to extract validation errors from Zod
 */
const formatZodErrors = (error) => {
  const issues = error.issues || error.errors || [];
  return issues.map(err => err.message).join(', ');
};

/**
 * @desc    Auth user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const { email, password } = parsed.data;

    const user = await authService.loginUser(email, password);
    const token = generateTokenAndSetCookie(res, user.id, user.role);

    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        initials: user.initials,
        theme: user.theme,
        language: user.language,
        department: user.department,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = (req, res) => {
  try {
    res.cookie('jwt', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req, res) => {
  try {
    // req.user is set by auth middleware
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const user = await authService.getUserById(req.user.id);
    res.status(200).json({ user });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('GetMe Error:', error);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
};

/**
 * @desc    Submit a registration request (Signup)
 * @route   POST /api/auth/signup
 * @access  Public
 */
export const signup = async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const { firstName, lastName, email, password, role, department } = parsed.data;
    const dbRole = mapFrontendRoleToEnum(role);

    const newRequest = await authService.createRegistrationRequest({
      firstName,
      lastName,
      email,
      password,
      dbRole,
      department
    });

    res.status(201).json({
      message: 'Registration request submitted successfully. It is now pending admin approval.',
      request: newRequest
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Signup Error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};



export const updateProfileHandler = async (req, res) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const updatedUser = await authService.updateProfile(req.user.id, parsed.data);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        initials: updatedUser.initials,
        theme: updatedUser.theme,
        language: updatedUser.language,
        department: updatedUser.department,
        departmentId: updatedUser.departmentId,
      }
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
};

export const changePasswordHandler = async (req, res) => {
  try {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    await authService.changePassword(req.user.id, parsed.data.currentPassword, parsed.data.newPassword);
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    console.error('Change Password Error:', error);
    res.status(500).json({ message: 'Server error during password update' });
  }
};
