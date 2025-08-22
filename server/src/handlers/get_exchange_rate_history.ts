import { db } from '../db';
import { exchangeRateHistoryTable } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { type ExchangeRateHistory } from '../schema';

export const getExchangeRateHistory = async (projectId: number): Promise<ExchangeRateHistory[]> => {
  try {
    const results = await db.select()
      .from(exchangeRateHistoryTable)
      .where(eq(exchangeRateHistoryTable.project_id, projectId))
      .orderBy(desc(exchangeRateHistoryTable.effective_date));

    // Convert numeric fields back to numbers before returning
    return results.map(rate => ({
      ...rate,
      usd_to_crc_rate: parseFloat(rate.usd_to_crc_rate)
    }));
  } catch (error) {
    console.error('Get exchange rate history failed:', error);
    throw error;
  }
};