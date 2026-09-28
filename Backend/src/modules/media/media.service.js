import { Media } from '../../models/Media.js';
import { Organization } from '../../models/Organization.js';
import { NotFoundError } from '../../common/errors.js';
import { env } from '../../config/env.js';

export const saveMediaRecord = async (actorUser, file, { ownerType = 'asset', ownerId }) => {
  let orgId = actorUser?.orgId;
  if (!orgId) {
    const org = await Organization.findOne();
    orgId = org?._id;
  }

  const fileUrl = `${env.PUBLIC_BASE_URL}/uploads/${file.filename}`;

  const media = await Media.create({
    orgId,
    ownerType,
    ownerId,
    url: fileUrl,
    storageKey: file.filename,
    mime: file.mimetype,
    sizeBytes: file.size,
    uploadedBy: actorUser?._id || null
  });

  return media;
};

export const deleteMediaRecord = async (actorUser, mediaId, scopeFilter) => {
  const media = await Media.findOne({ _id: mediaId, ...scopeFilter });
  if (!media) throw new NotFoundError('Media not found');
  await Media.deleteOne({ _id: mediaId });
  return { message: 'Media deleted' };
};
