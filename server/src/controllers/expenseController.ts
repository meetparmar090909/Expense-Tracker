import { Response } from 'express';
import Expense from '../models/Expense';
import { AuthRequest } from '../middleware/auth';

// @GET /api/expenses
export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, month, year, limit = 50, page = 1 } = req.query;
    const filter: any = { userId: req.userId };

    if (category && category !== 'All') filter.category = category;
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1);
      const end = new Date(Number(year), Number(month), 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [expenses, total] = await Promise.all([
      Expense.find(filter).sort({ date: -1 }).skip(skip).limit(Number(limit)),
      Expense.countDocuments(filter)
    ]);

    res.json({ success: true, expenses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/expenses
export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.create({ ...req.body, userId: req.userId });
    res.status(201).json({ success: true, expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @PUT /api/expenses/:id
export const updateExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found.' }); return; }
    res.json({ success: true, expense });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @DELETE /api/expenses/:id
export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) { res.status(404).json({ success: false, message: 'Expense not found.' }); return; }
    res.json({ success: true, message: 'Expense deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/expenses/stats
export const getStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    const m = Number(month) || new Date().getMonth() + 1;
    const y = Number(year) || new Date().getFullYear();
    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59);

    const [categoryStats, dailyStats, totalResult] = await Promise.all([
      Expense.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.userId!), date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]),
      Expense.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.userId!), date: { $gte: start, $lte: end } } },
        { $group: { _id: { $dayOfMonth: '$date' }, total: { $sum: '$amount' } } },
        { $sort: { '_id': 1 } }
      ]),
      Expense.aggregate([
        { $match: { userId: require('mongoose').Types.ObjectId.createFromHexString(req.userId!), date: { $gte: start, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        categoryBreakdown: categoryStats,
        dailySpending: dailyStats,
        totalSpent: totalResult[0]?.total || 0,
        month: m, year: y
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
