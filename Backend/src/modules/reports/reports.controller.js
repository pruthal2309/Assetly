import * as reportService from './reports.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const createPublicReport = asyncHandler(async (req, res) => {
  const result = await reportService.createPublicReport(req.body, req.user || null);
  res.status(201).json({ data: result });
});

export const getPublicReportByCode = asyncHandler(async (req, res) => {
  const report = await reportService.getPublicReportByCode(req.params.code);
  res.json({ data: report });
});

export const getPublicAssetByCode = asyncHandler(async (req, res) => {
  const asset = await reportService.getPublicAssetByCode(req.params.assetCode);
  res.json({ data: asset });
});

export const listStaffReports = asyncHandler(async (req, res) => {
  const reports = await reportService.listStaffReports(req.scope);
  res.json({ data: reports });
});

export const triage = asyncHandler(async (req, res) => {
  const report = await reportService.triageReport(req.user, req.params.id, req.body, req.scope);
  res.json({ data: report });
});
