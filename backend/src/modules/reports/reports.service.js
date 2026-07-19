import prisma from '../../../prisma/prisma.js';
import { AppError } from '../../utils/AppError.js';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// --- Dashboard Metrics ---
export const getDashboardMetrics = async () => {
  // 1. KPIs
  const totalDevices = await prisma.device.count();
  
  const openWOs = await prisma.workOrder.count({ where: { status: { not: 'DONE' } } });
  
  const totalPMs = await prisma.pMTask.count();
  const completedPMs = await prisma.pMTask.count({ where: { status: 'COMPLETED' } });
  const pmCompliance = totalPMs > 0 ? Math.round((completedPMs / totalPMs) * 100) : 100;
  
  const activeFaults = await prisma.faultReport.count({ where: { status: { not: 'SOLVED' } } });
  const faultRate = totalDevices > 0 ? ((activeFaults / totalDevices) * 100).toFixed(1) : 0;

  // 2. Fault Trend (Rolling 30 days)
  const faultTrendMap = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    faultTrendMap[d.toISOString().split('T')[0]] = 0;
  }
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentFaults = await prisma.faultReport.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { createdAt: true }
  });
  
  recentFaults.forEach(f => {
    const dateStr = f.createdAt.toISOString().split('T')[0];
    if (faultTrendMap[dateStr] !== undefined) {
      faultTrendMap[dateStr]++;
    }
  });
  
  const faultTrend = Object.keys(faultTrendMap).map(dateStr => {
    return { day: new Date(dateStr).getDate(), faults: faultTrendMap[dateStr] };
  });

  // 3. Recent Urgent Work Orders
  const recentUrgentWOsDb = await prisma.workOrder.findMany({
    where: { 
      status: { notIn: ['DONE', 'CANCELLED'] },
      priority: { in: ['HIGH', 'CRITICAL'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      device: { 
        include: { 
          department: { select: { name: true } } 
        } 
      }
    }
  });
  
  const recentUrgentWOs = recentUrgentWOsDb.map(wo => ({
    id: wo.workOrderNumber,
    device: wo.device?.name || 'Unknown',
    department: wo.device?.department?.name || 'Unknown',
    priority: wo.priority,
    status: wo.status,
  }));

  // 4. Technician Workloads
  const technicians = await prisma.user.findMany({
    where: { role: 'TECHNICIAN', isActive: true },
    select: {
      name: true,
      _count: {
        select: {
          assignedWorkOrders: {
            where: { status: { notIn: ['DONE', 'CANCELLED'] } }
          }
        }
      }
    }
  });
  
  const techWorkloads = technicians.map(t => ({
    name: t.name,
    count: t._count.assignedWorkOrders
  }));

  // 6. Devices by Department
  const devicesByDeptDb = await prisma.device.groupBy({
    by: ['departmentId'],
    _count: { id: true },
    where: { status: 'OPERATIONAL' }
  });
  
  const allDepartments = await prisma.department.findMany({
    select: { id: true, name: true }
  });
  
  const deptNameMap = {};
  allDepartments.forEach(d => { deptNameMap[d.id] = d.name });
  
  const COLORS = ['#3B72F6', '#F59E0B', '#22C55E', '#A855F7', '#EF4444', '#94A3B8'];
  
  const devDeptCountMap = {};
  devicesByDeptDb.forEach(d => {
    const name = d.departmentId && deptNameMap[d.departmentId] ? deptNameMap[d.departmentId] : 'Other';
    devDeptCountMap[name] = (devDeptCountMap[name] || 0) + d._count.id;
  });
  
  const devicesByDept = Object.keys(devDeptCountMap).map((name, i) => ({
    name,
    count: devDeptCountMap[name],
    pct: 0,
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.count - a.count);
  
  const totalActiveDevices = devicesByDept.reduce((acc, curr) => acc + curr.count, 0);
  devicesByDept.forEach(d => {
    d.pct = totalActiveDevices > 0 ? Math.round((d.count / totalActiveDevices) * 100) : 0;
  });

  // 7. Work Orders by Department (Active)
  const activeWOs = await prisma.workOrder.findMany({
    where: { status: { notIn: ['DONE', 'CANCELLED'] } },
    select: { device: { select: { departmentId: true } } }
  });
  
  const woDeptCountMap = {};
  activeWOs.forEach(wo => {
    const dId = wo.device?.departmentId;
    const name = dId && deptNameMap[dId] ? deptNameMap[dId] : 'Other';
    woDeptCountMap[name] = (woDeptCountMap[name] || 0) + 1;
  });

  const workOrdersByDept = Object.keys(woDeptCountMap).map((name, i) => ({
    name,
    value: woDeptCountMap[name],
    color: COLORS[i % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  return {
    kpis: {
      totalDevices,
      faultRate: `${faultRate}%`,
      openWorkOrders: openWOs,
      pmCompliance: `${pmCompliance}%`
    },
    faultTrend,
    recentUrgentWOs,
    techWorkloads,
    devicesByDept,
    workOrdersByDept
  };
};

// --- Analytics Page Metrics ---
export const getAnalyticsMetrics = async (userId) => {
  // 1. KPIs
  const totalDevices = await prisma.device.count();
  const totalWOs = await prisma.workOrder.count();
  const completedWOs = await prisma.workOrder.count({ where: { status: 'DONE' } });
  const totalPMs = await prisma.pMTask.count();
  
  const recordsTracked = totalDevices + totalWOs + totalPMs;
  const woCompletionRate = totalWOs > 0 ? Math.round((completedWOs / totalWOs) * 100) : 0;
  
  const criticalAlerts = await prisma.userAlert.count({
    where: { userId, isRead: false, alert: { type: 'CRITICAL' } }
  });

  // 2. PM Compliance Trend (12 Months)
  const oneYearAgo = new Date();
  oneYearAgo.setMonth(oneYearAgo.getMonth() - 11);
  oneYearAgo.setDate(1); 
  
  const recentPMs = await prisma.pMTask.findMany({
    where: { scheduledAt: { gte: oneYearAgo } },
    select: { scheduledAt: true, status: true }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const complianceMap = {};
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const mName = monthNames[d.getMonth()];
    complianceMap[mName] = { total: 0, completed: 0 };
  }

  recentPMs.forEach(pm => {
    const mName = monthNames[pm.scheduledAt.getMonth()];
    if (complianceMap[mName]) {
      complianceMap[mName].total++;
      if (pm.status === 'COMPLETED') complianceMap[mName].completed++;
    }
  });

  const complianceData = Object.keys(complianceMap).map(name => {
    const { total, completed } = complianceMap[name];
    const value = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { name, value };
  });

  // 3. Fault Analysis by Department
  const faults = await prisma.faultReport.findMany({
    select: { device: { select: { departmentId: true } } }
  });
  
  const allDepartments = await prisma.department.findMany({ select: { id: true, name: true } });
  const deptNameMap = {};
  allDepartments.forEach(d => { deptNameMap[d.id] = d.name });
  
  const faultMap = {};
  allDepartments.forEach(d => { faultMap[d.name] = 0; });
  faultMap['Other'] = 0;

  faults.forEach(f => {
    const dId = f.device?.departmentId;
    const name = dId && deptNameMap[dId] ? deptNameMap[dId] : 'Other';
    if (faultMap[name] !== undefined) {
      faultMap[name]++;
    }
  });
  
  const faultData = Object.keys(faultMap)
    .map(name => ({ name, value: faultMap[name] }))
    .filter(d => d.value > 0 || d.name !== 'Other');

  // 4. Work Orders by Device Category (Replaces Cost)
  const wosByCategoryDb = await prisma.workOrder.findMany({
    select: { status: true, device: { select: { category: true } } }
  });
  
  const woCatMap = {};
  wosByCategoryDb.forEach(wo => {
    const cat = wo.device?.category || 'Uncategorized';
    if (!woCatMap[cat]) woCatMap[cat] = { open: 0, completed: 0 };
    if (wo.status === 'DONE' || wo.status === 'CANCELLED') woCatMap[cat].completed++;
    else woCatMap[cat].open++;
  });
  
  const categoryData = Object.keys(woCatMap).map(name => ({
    name,
    open: woCatMap[name].open,
    completed: woCatMap[name].completed
  }));


  return {
    kpis: {
      recordsTracked,
      woCompletionRate: `${woCompletionRate}%`,
      totalDevices,
      criticalAlerts
    },
    complianceData,
    faultData,
    categoryData
  };
};

export const getGeneratedReports = async ({ page = 1, limit = 10, category, format, search }) => {
  const skip = (page - 1) * limit;
  const where = {};

  if (category) where.category = category;
  if (format) where.format = format;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [items, total] = await Promise.all([
    prisma.generatedReport.findMany({
      where,
      skip,
      take: limit,
      orderBy: { generatedAt: 'desc' },
      include: { requestedBy: { select: { name: true } } }
    }),
    prisma.generatedReport.count({ where })
  ]);

  return {
    items,
    meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
  };
};

// --- Report Generation Logic ---

const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

export const generateReport = async (userId, data) => {
  const { title, category, format, period } = data;

  if (format !== 'PDF') {
    throw new AppError(`Generation of ${format} is not supported in this MVP. Only PDF is supported.`, 400);
  }

  // Create PENDING record
  const report = await prisma.generatedReport.create({
    data: {
      title,
      category,
      format,
      period,
      status: 'PENDING',
      requestedById: userId
    }
  });

  // Determine report type based on title (simple heuristic for MVP)
  const isTech = title.toLowerCase().includes('technician');
  const isPM = title.toLowerCase().includes('pm') || title.toLowerCase().includes('preventive');
  const isFault = title.toLowerCase().includes('fault') || title.toLowerCase().includes('failure');
  const isGeneral = title.toLowerCase().includes('general');

  let reportType = isGeneral ? 'GENERAL' : isPM ? 'PM' : isFault ? 'FAULT' : isTech ? 'TECH' : 'PM'; // Default to PM if unknown

  // Generate PDF asynchronously (or synchronously depending on preference, we will await for simplicity here)
  try {
    const reportsDir = path.join(process.cwd(), 'uploads', 'reports');
    ensureDir(reportsDir);

    const fileName = `RPT-${report.id}.pdf`;
    const filePath = path.join(reportsDir, fileName);

    const doc = new PDFDocument({ margin: 50 });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated Date: ${new Date().toLocaleString()}`, { align: 'right' });
    doc.moveDown(2);

    // Call specific generators
    if (reportType === 'PM') {
      await generatePMReportContent(doc);
    } else if (reportType === 'FAULT') {
      await generateFaultReportContent(doc);
    } else if (reportType === 'TECH') {
      await generateTechReportContent(doc);
    } else if (reportType === 'GENERAL') {
      await generatePMReportContent(doc);
      doc.addPage();
      await generateFaultReportContent(doc);
      doc.addPage();
      await generateTechReportContent(doc);
    }

    doc.end();

    // Wait for write to finish
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

    const stats = fs.statSync(filePath);

    // Update record to COMPLETED
    return await prisma.generatedReport.update({
      where: { id: report.id },
      data: {
        status: 'COMPLETED',
        filePath: fileName,
        sizeBytes: stats.size
      },
      include: { requestedBy: { select: { name: true } } }
    });

  } catch (error) {
    await prisma.generatedReport.update({
      where: { id: report.id },
      data: { status: 'FAILED' }
    });
    throw new AppError('Failed to generate report', 500);
  }
};

const generatePMReportContent = async (doc) => {
  const totalPM = await prisma.pMTask.count();
  const completedPM = await prisma.pMTask.count({ where: { status: 'COMPLETED' } });
  const pendingPM = await prisma.pMTask.count({ where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } } });
  const overduePM = await prisma.pMTask.count({ where: { status: 'OVERDUE' } });
  
  const compliance = totalPM > 0 ? Math.round((completedPM / totalPM) * 100) : 0;

  doc.fontSize(14).text('Executive Summary / KPIs', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12)
     .text(`Total PM Tasks: ${totalPM}`)
     .text(`Completed: ${completedPM}`)
     .text(`Pending: ${pendingPM}`)
     .text(`Overdue: ${overduePM}`)
     .text(`Overall PM Compliance: ${compliance}%`);
  
  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (overduePM > 0) {
    doc.text(`- There are ${overduePM} overdue PM tasks. Prioritize scheduling technicians to resolve these immediately to maintain equipment reliability.`);
  } else {
    doc.text('- PM compliance is well-managed with no overdue tasks currently.');
  }
  if (compliance < 80) {
    doc.text('- Overall PM compliance is below 80%. Consider increasing technician capacity or reviewing PM frequency.');
  }
};

const generateFaultReportContent = async (doc) => {
  const totalFaults = await prisma.faultReport.count();
  const resolvedFaults = await prisma.faultReport.count({ where: { status: 'SOLVED' } });
  const pendingFaults = await prisma.faultReport.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } });

  doc.fontSize(14).text('Executive Summary / KPIs', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12)
     .text(`Total Fault Reports: ${totalFaults}`)
     .text(`Resolved Faults: ${resolvedFaults}`)
     .text(`Pending Faults: ${pendingFaults}`);

  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (pendingFaults > resolvedFaults) {
    doc.text('- You have more pending faults than resolved ones. Reallocate technical staff to tackle the backlog.');
  } else {
    doc.text('- Fault resolution rate is healthy.');
  }
};

const generateTechReportContent = async (doc) => {
  const techStats = await prisma.user.findMany({
    where: { role: 'TECHNICIAN' },
    select: {
      name: true,
      _count: {
        select: {
          assignedWorkOrders: true,
          assignedPMTasks: true
        }
      }
    }
  });

  doc.fontSize(14).text('Technician Workloads', { underline: true });
  doc.moveDown(0.5);
  
  let maxTech = null;
  let maxCount = -1;

  techStats.forEach(t => {
    const total = t._count.assignedWorkOrders + t._count.assignedPMTasks;
    doc.fontSize(12).text(`${t.name}: ${total} total assignments (${t._count.assignedWorkOrders} WOs, ${t._count.assignedPMTasks} PMs)`);
    if (total > maxCount) {
      maxCount = total;
      maxTech = t.name;
    }
  });

  doc.moveDown(2);
  doc.fontSize(14).text('Recommendations', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12);
  if (maxTech) {
    doc.text(`- Technician ${maxTech} currently has the highest workload (${maxCount} tasks). Consider redistributing tasks to prevent burnout and delays.`);
  }
};

export const getReportFile = async (id) => {
  const report = await prisma.generatedReport.findUnique({ where: { id } });
  if (!report || !report.filePath) {
    throw new AppError('Report file not found', 404);
  }
  const fullPath = path.join(process.cwd(), 'uploads', 'reports', report.filePath);
  if (!fs.existsSync(fullPath)) {
    throw new AppError('File physically missing from server', 404);
  }
  return { path: fullPath, name: report.filePath };
};
