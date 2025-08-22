import { db } from '../db';
import { projectsTable, exchangeRateHistoryTable } from '../db/schema';
import { type UpdateExchangeRateInput, type ExchangeRateHistory } from '../schema';
import { eq } from 'drizzle-orm';

export const updateExchangeRate = async (input: UpdateExchangeRateInput): Promise<ExchangeRateHistory> => {
  try {
    // First, verify the project exists
    const existingProject = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, input.project_id))
      .limit(1)
      .execute();

    if (existingProject.length === 0) {
      throw new Error(`Project with id ${input.project_id} not found`);
    }

    // Update the current exchange rate in the projects table
    await db.update(projectsTable)
      .set({ 
        current_exchange_rate: input.usd_to_crc_rate.toString(),
        updated_at: new Date()
      })
      .where(eq(projectsTable.id, input.project_id))
      .execute();

    // Record the exchange rate change in history
    const historyResult = await db.insert(exchangeRateHistoryTable)
      .values({
        project_id: input.project_id,
        usd_to_crc_rate: input.usd_to_crc_rate.toString()
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const historyRecord = historyResult[0];
    return {
      ...historyRecord,
      usd_to_crc_rate: parseFloat(historyRecord.usd_to_crc_rate)
    };
  } catch (error) {
    console.error('Exchange rate update failed:', error);
    throw error;
  }
};