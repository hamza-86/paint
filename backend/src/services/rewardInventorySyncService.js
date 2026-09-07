import mongoose from 'mongoose';
import RewardInventoryItem from '../models/RewardInventoryItem.js';
import CompanyRewardEntry from '../models/CompanyRewardEntry.js';

/**
 * Validates that an update to CompanyRewardEntry rewardItems will not violate
 * already-assigned inventory stock constraints.
 *
 * @param {string|mongoose.Types.ObjectId} entryId
 * @param {Array} updatedRewardItems
 * @throws {Error} with statusCode 400 if validation fails
 */
export async function validateCompanyRewardSync(entryId, updatedRewardItems) {
  if (!entryId || !Array.isArray(updatedRewardItems)) return;

  const existingInventoryItems = await RewardInventoryItem.find({
    sourceCompanyRewardEntryId: new mongoose.Types.ObjectId(entryId),
  });

  const updatedItemsMap = new Map();
  for (const item of updatedRewardItems) {
    const key = item._id ? String(item._id) : (item.id ? String(item.id) : null);
    if (key) {
      updatedItemsMap.set(key, item);
    }
  }

  for (const inv of existingInventoryItems) {
    const sourceItemIdStr = String(inv.sourceCompanyRewardItemId);
    const assignedQty = Math.max(0, (inv.totalQty || 0) - (inv.remainingQty || 0));

    // Case 1: Item was removed from company reward entry
    if (updatedItemsMap.size > 0 && !updatedItemsMap.has(sourceItemIdStr)) {
      // Check if it might match by name if _id was omitted by client
      const matchedByName = updatedRewardItems.find(
        (u) => !u._id && !u.id && String(u.name).trim().toLowerCase() === String(inv.name).trim().toLowerCase()
      );
      if (!matchedByName && assignedQty > 0) {
        const err = new Error(
          `Cannot remove reward item "${inv.name}" because ${assignedQty} unit(s) have already been assigned to painters.`
        );
        err.statusCode = 400;
        throw err;
      }
    }

    // Case 2: Item quantity is reduced below assignedQty
    let matchedItem = updatedItemsMap.get(sourceItemIdStr);
    if (!matchedItem) {
      // Fallback matching by name if client didn't send _id
      matchedItem = updatedRewardItems.find(
        (u) => String(u.name).trim().toLowerCase() === String(inv.name).trim().toLowerCase()
      );
    }

    if (matchedItem) {
      const newQty = Number(matchedItem.quantity);
      if (newQty < assignedQty) {
        const err = new Error(
          `Cannot reduce quantity for "${inv.name}" to ${newQty}. ${assignedQty} unit(s) have already been assigned to painters.`
        );
        err.statusCode = 400;
        throw err;
      }
    }
  }
}

/**
 * Synchronizes structured reward items from a CompanyRewardEntry into RewardInventoryItem records.
 * Ensures strict idempotency:
 *   - Creates new RewardInventoryItem if not yet present
 *   - Safely updates totalQty and remainingQty if already present
 *   - Preserves assigned quantity: remainingQty = newTotalQty - assignedQty
 *   - Removes unassigned inventory items if removed from the entry
 *
 * @param {Object} entry - CompanyRewardEntry document
 * @returns {Promise<Array>} List of synchronized RewardInventoryItem documents
 */
export async function syncCompanyRewardToInventory(entry) {
  if (!entry || !entry._id) return [];

  const entryId = entry._id;
  const rewardItems = Array.isArray(entry.rewardItems) ? entry.rewardItems : [];

  const existingInventoryItems = await RewardInventoryItem.find({
    sourceCompanyRewardEntryId: entryId,
  });

  const existingBySourceItemId = new Map();
  for (const inv of existingInventoryItems) {
    existingBySourceItemId.set(String(inv.sourceCompanyRewardItemId), inv);
  }

  const processedSourceItemIds = new Set();
  const synchronizedItems = [];

  for (const item of rewardItems) {
    const sourceItemIdStr = String(item._id);
    processedSourceItemIds.add(sourceItemIdStr);

    let inventoryDoc = existingBySourceItemId.get(sourceItemIdStr);

    // If not found by sourceCompanyRewardItemId, check if an existing item has the same name
    // (handles cases where rewardItems subdocuments got recreated without new IDs)
    if (!inventoryDoc) {
      inventoryDoc = existingInventoryItems.find(
        (inv) =>
          !processedSourceItemIds.has(String(inv.sourceCompanyRewardItemId)) &&
          String(inv.name).trim().toLowerCase() === String(item.name).trim().toLowerCase()
      );
      if (inventoryDoc) {
        // Link to this specific subdocument ID
        inventoryDoc.sourceCompanyRewardItemId = item._id;
        processedSourceItemIds.add(String(inventoryDoc.sourceCompanyRewardItemId));
      }
    }

    const targetQty = Number(item.quantity);
    const targetName = String(item.name).trim();
    const targetImageUrl = item.imageUrl ? String(item.imageUrl).trim() : '';

    if (!inventoryDoc) {
      // Create new inventory item
      const created = await RewardInventoryItem.create({
        name: targetName,
        imageUrl: targetImageUrl,
        sourceCompanyRewardEntryId: entryId,
        sourceCompanyRewardItemId: item._id,
        totalQty: targetQty,
        remainingQty: targetQty,
        status: 'active',
      });
      synchronizedItems.push(created);
    } else {
      // Update existing inventory item
      const assignedQty = Math.max(0, (inventoryDoc.totalQty || 0) - (inventoryDoc.remainingQty || 0));

      if (targetQty < assignedQty) {
        const err = new Error(
          `Cannot reduce quantity for "${inventoryDoc.name}" to ${targetQty}. ${assignedQty} unit(s) have already been assigned to painters.`
        );
        err.statusCode = 400;
        throw err;
      }

      inventoryDoc.name = targetName;
      if (targetImageUrl) {
        inventoryDoc.imageUrl = targetImageUrl;
      }
      inventoryDoc.totalQty = targetQty;
      inventoryDoc.remainingQty = Math.max(0, targetQty - assignedQty);

      await inventoryDoc.save();
      synchronizedItems.push(inventoryDoc);
    }
  }

  // Handle removed items
  for (const inv of existingInventoryItems) {
    const sourceItemIdStr = String(inv.sourceCompanyRewardItemId);
    if (!processedSourceItemIds.has(sourceItemIdStr)) {
      const assignedQty = Math.max(0, (inv.totalQty || 0) - (inv.remainingQty || 0));
      if (assignedQty > 0) {
        const err = new Error(
          `Cannot remove reward item "${inv.name}" because ${assignedQty} unit(s) have already been assigned to painters.`
        );
        err.statusCode = 400;
        throw err;
      } else {
        await RewardInventoryItem.deleteOne({ _id: inv._id });
      }
    }
  }

  return synchronizedItems;
}

/**
 * Reconcile all existing CompanyRewardEntry records in the database.
 * Safe, idempotent startup or migration helper that ensures no company reward items
 * are missing from RewardInventoryItem.
 */
export async function reconcileAllCompanyRewardsToInventory() {
  const entries = await CompanyRewardEntry.find();
  let createdCount = 0;
  let updatedCount = 0;

  for (const entry of entries) {
    if (!entry.rewardItems || entry.rewardItems.length === 0) continue;

    for (const item of entry.rewardItems) {
      const existing = await RewardInventoryItem.findOne({
        sourceCompanyRewardEntryId: entry._id,
        sourceCompanyRewardItemId: item._id,
      });

      if (!existing) {
        // Also check by name and entryId to avoid duplicates from older manual additions
        const existingByName = await RewardInventoryItem.findOne({
          sourceCompanyRewardEntryId: entry._id,
          name: new RegExp(`^${String(item.name).trim()}$`, 'i'),
        });

        if (existingByName) {
          // Relink to the exact subdocument ID
          existingByName.sourceCompanyRewardItemId = item._id;
          await existingByName.save();
          updatedCount++;
        } else {
          await RewardInventoryItem.create({
            name: String(item.name).trim(),
            imageUrl: item.imageUrl || '',
            sourceCompanyRewardEntryId: entry._id,
            sourceCompanyRewardItemId: item._id,
            totalQty: item.quantity,
            remainingQty: item.quantity,
            status: 'active',
          });
          createdCount++;
        }
      }
    }
  }

  return { createdCount, updatedCount, totalEntries: entries.length };
}

export default {
  validateCompanyRewardSync,
  syncCompanyRewardToInventory,
  reconcileAllCompanyRewardsToInventory,
};
