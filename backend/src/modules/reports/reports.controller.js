import { catchAsync } from '../../utils/catchAsync.js';
import * as reportsService from './reports.service.js';

export const getDashboardHandler = catchAsync(async (req, res) => {
  const data = await reportsService.getDashboardMetrics();
  res.status(200).json({
    success: true,
    data
  });
});

export const getAnalyticsHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const data = await reportsService.getAnalyticsMetrics(userId);
  res.status(200).json({
    success: true,
    data
  });
});

export const getReportsHandler = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { category, format, search } = req.query;

  const result = await reportsService.getGeneratedReports({ page, limit, category, format, search });
  res.status(200).json({
    success: true,
    data: result.items,
    meta: result.meta
  });
});

export const generateReportHandler = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const report = await reportsService.generateReport(userId, req.body);
  
  res.status(201).json({
    success: true,
    message: 'Report generated successfully',
    data: report
  });
});

export const downloadReportHandler = catchAsync(async (req, res) => {
  const { path: filePath, name } = await reportsService.getReportFile(req.params.id);
  res.download(filePath, name);
});
