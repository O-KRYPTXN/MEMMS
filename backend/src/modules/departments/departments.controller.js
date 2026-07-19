import { catchAsync } from '../../utils/catchAsync.js';
import * as departmentService from './departments.service.js';
import * as departmentValidation from './departments.validation.js';

const formatZodErrors = (error) => {
  return error.errors.map(err => err.message).join(', ');
};

/**
 * @desc    Get public active departments (for Signup)
 * @route   GET /api/departments/options
 * @access  Public
 */
export const getPublicDepartments = catchAsync(async (req, res) => {
  const result = await departmentService.getPublicActiveDepartments();
  res.status(200).json(result);
});

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private (All roles can view for dropdowns)
 */
export const getDepartments = catchAsync(async (req, res) => {
  const parsed = departmentValidation.queryDepartmentsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  const { page, limit, ...filters } = parsed.data;
  const result = await departmentService.getAllDepartments(page, limit, filters);

  res.status(200).json(result);
});

/**
 * @desc    Get single department by ID
 * @route   GET /api/departments/:id
 * @access  Private
 */
export const getDepartment = catchAsync(async (req, res) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    res.status(200).json({ data: department });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Create a new department
 * @route   POST /api/departments
 * @access  Private (Admin)
 */
export const createDepartment = catchAsync(async (req, res) => {
  try {
    const parsed = departmentValidation.createDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const newDept = await departmentService.createDepartment(parsed.data);
    res.status(201).json({
      message: 'Department created successfully',
      data: newDept
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

/**
 * @desc    Update department
 * @route   PATCH /api/departments/:id
 * @access  Private (Admin)
 */
export const updateDepartment = catchAsync(async (req, res) => {
  try {
    const parsed = departmentValidation.updateDepartmentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: formatZodErrors(parsed.error) });
    }

    const updatedDept = await departmentService.updateDepartment(req.params.id, parsed.data);
    
    let actionMessage = 'Department updated successfully';
    if (parsed.data.isActive === false) actionMessage = 'Department deactivated';
    if (parsed.data.isActive === true) actionMessage = 'Department activated';

    res.status(200).json({
      message: actionMessage,
      data: updatedDept
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});
