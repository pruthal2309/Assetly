import * as assetService from './assets.service.js';
import { asyncHandler } from '../../common/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  const { cursor, limit, ...queryFilters } = req.query;
  const result = await assetService.listAssets(queryFilters, req.scope, cursor, limit);
  res.json({
    data: result.assets,
    meta: { nextCursor: result.nextCursor, total: result.total }
  });
});

export const map = asyncHandler(async (req, res) => {
  const { bbox, category, status, risk } = req.query;
  const points = await assetService.getMapAssets(bbox, category, status, risk, req.scope);
  res.json({ data: points });
});

export const getById = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.scope);
  res.json({ data: asset });
});

export const create = asyncHandler(async (req, res) => {
  const asset = await assetService.createAsset(req.user, req.body);
  res.status(201).json({ data: asset });
});

export const update = asyncHandler(async (req, res) => {
  const asset = await assetService.updateAsset(req.user, req.params.id, req.body, req.scope);
  res.json({ data: asset });
});

export const changeStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const asset = await assetService.changeAssetStatus(req.user, req.params.id, status, reason, req.scope);
  res.json({ data: asset });
});

export const getQr = asyncHandler(async (req, res) => {
  const asset = await assetService.getAssetById(req.params.id, req.scope);
  const qrDataUrl = await assetService.generateQrCode(asset.assetCode);
  res.json({ data: { qrUrl: qrDataUrl, assetCode: asset.assetCode } });
});

export const getEvents = asyncHandler(async (req, res) => {
  const events = await assetService.getAssetEvents(req.params.id, req.scope);
  res.json({ data: events });
});
