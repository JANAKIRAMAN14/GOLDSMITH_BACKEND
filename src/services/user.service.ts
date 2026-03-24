import { UserModel } from '../models/User';
import { isSameDay, todayString } from '../utils/date';

export async function ensureUserDailyGoldReset(userId: string) {
  const user = await UserModel.findById(userId);
  if (!user) return null;

  const today = todayString();
  if (!isSameDay(user.goldRateDate, today)) {
    user.todayGoldRate = 0;
    user.goldRateDate = new Date();
    await user.save();
  }

  return user;
}
