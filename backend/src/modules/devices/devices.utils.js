import { AppError } from '../../utils/AppError.js';

/**
 * Shared guard used by faultReports, workOrders, pmTasks, and device status
 * updates to prevent any operational action on a decommissioned device.
 * Centralised here so the rule is maintained in one place.
 *
 * @param {object} device - A Prisma Device record (must include `status` and `assetCode`)
 */
export const assertDeviceNotDecommissioned = (device) => {
  if (device.status === 'DECOMMISSIONED') {
    throw new AppError(
      `Device ${device.assetCode} has been decommissioned and cannot participate in operational workflows. Restore the device first.`,
      400
    );
  }
};
