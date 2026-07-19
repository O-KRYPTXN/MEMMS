import { catchAsync } from '../../utils/catchAsync.js';
import * as faultReportService from './faultReports.service.js';
import * as faultReportValidation from './faultReports.validation.js';

const formatZodErrors = (error) => {
  return error.errors.map(err => err.message).join(', ');
};

export const createFaultReport = catchAsync(async (req, res) => {
  const parsed = faultReportValidation.createFaultReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  try {
    const report = await faultReportService.createFaultReport(parsed.data, req.user.id);
    res.status(201).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});

export const getFaultReports = catchAsync(async (req, res) => {
  const parsed = faultReportValidation.queryFaultReportsSchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  const { page, limit, ...filters } = parsed.data;
  const result = await faultReportService.getFaultReports(page, limit, filters, req.user);
  
  res.status(200).json(result);
});

export const getFaultReportStats = catchAsync(async (req, res) => {
  const stats = await faultReportService.getFaultReportStats(req.user);
  res.status(200).json({
    status: 'success',
    data: stats
  });
});

export const updateFaultReport = catchAsync(async (req, res) => {
  const parsed = faultReportValidation.updateFaultReportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: formatZodErrors(parsed.error) });
  }

  try {
    const report = await faultReportService.updateFaultReport(req.params.id, parsed.data);
    res.status(200).json({
      status: 'success',
      data: report
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    throw error;
  }
});
