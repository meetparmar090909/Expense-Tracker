import { Response } from 'express';
import Trip, { ITrip, ITripExpense, ITripParticipant } from '../models/Trip';
import { AuthRequest } from '../middleware/auth';

const roundToTwo = (value: number) => Math.round(value * 100) / 100;

const serializeTrip = (trip: ITrip) => {
  const participants = trip.participants.map((participant) => ({
    name: participant.name,
    contributedAmount: participant.contributedAmount,
  }));

  const expenses = trip.expenses.map((expense) => ({
    title: expense.title,
    amount: expense.amount,
    paidBy: expense.paidBy,
    date: expense.date,
    note: expense.note,
  }));

  const totalContributed = roundToTwo(participants.reduce((sum, participant) => sum + participant.contributedAmount, 0));
  const totalSpent = roundToTwo(expenses.reduce((sum, expense) => sum + expense.amount, 0));
  const participantCount = participants.length || 1;
  const sharePerPerson = roundToTwo(totalSpent / participantCount);
  const remainingBalance = roundToTwo(totalContributed - totalSpent);

  const settlements = participants.map((participant) => {
    const net = roundToTwo(participant.contributedAmount - sharePerPerson);
    return {
      name: participant.name,
      contributedAmount: participant.contributedAmount,
      share: sharePerPerson,
      net,
      status: net > 0 ? 'gets back' : net < 0 ? 'owes' : 'settled',
    };
  });

  return {
    _id: trip._id,
    title: trip.title,
    destination: trip.destination,
    currency: trip.currency,
    startDate: trip.startDate,
    endDate: trip.endDate,
    note: trip.note,
    participants,
    expenses,
    summary: {
      totalContributed,
      totalSpent,
      remainingBalance,
      sharePerPerson,
      participantCount,
      settlements,
    },
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
};

const sanitizeParticipants = (participants: ITripParticipant[] | undefined) =>
  (participants ?? [])
    .map((participant) => ({
      name: participant.name?.trim(),
      contributedAmount: Number(participant.contributedAmount) || 0,
    }))
    .filter((participant) => participant.name);

const sanitizeExpenses = (expenses: ITripExpense[] | undefined) =>
  (expenses ?? [])
    .map((expense) => ({
      title: expense.title?.trim(),
      amount: Number(expense.amount),
      paidBy: expense.paidBy?.trim(),
      date: expense.date ? new Date(expense.date) : new Date(),
      note: expense.note?.trim(),
    }))
    .filter((expense) => expense.title && expense.paidBy && expense.amount > 0);

export const getTrips = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trips = await Trip.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ success: true, trips: trips.map(serializeTrip) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const participants = sanitizeParticipants(req.body.participants);
    if (!participants.length) {
      res.status(400).json({ success: false, message: 'Add at least one participant.' });
      return;
    }

    const trip = await Trip.create({
      userId: req.userId,
      title: req.body.title,
      destination: req.body.destination,
      currency: req.body.currency,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      note: req.body.note,
      participants,
      expenses: sanitizeExpenses(req.body.expenses),
    });

    res.status(201).json({ success: true, trip: serializeTrip(trip) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const participants = sanitizeParticipants(req.body.participants);
    if (!participants.length) {
      res.status(400).json({ success: false, message: 'Add at least one participant.' });
      return;
    }

    const trip = await Trip.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      {
        title: req.body.title,
        destination: req.body.destination,
        currency: req.body.currency,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        note: req.body.note,
        participants,
        expenses: sanitizeExpenses(req.body.expenses),
      },
      { new: true, runValidators: true },
    );

    if (!trip) {
      res.status(404).json({ success: false, message: 'Trip not found.' });
      return;
    }

    res.json({ success: true, trip: serializeTrip(trip) });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteTrip = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trip = await Trip.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!trip) {
      res.status(404).json({ success: false, message: 'Trip not found.' });
      return;
    }

    res.json({ success: true, message: 'Trip deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
