import prisma from '../config/prisma.js';

const toDateStart = (d) => {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};

const toDateEnd = (d) => {
  const dt = new Date(d);
  dt.setHours(23, 59, 59, 999);
  return dt;
};

export const getDailyRecords = async (req, res) => {
  try {
    const { search, type, startDate, endDate, group } = req.query;

    const where = {};

    if (startDate) {
      where.transactionDate = { ...where.transactionDate, gte: toDateStart(startDate) };
    }
    if (endDate) {
      where.transactionDate = { ...where.transactionDate, lte: toDateEnd(endDate) };
    }
    if (type && (type === 'INCOME' || type === 'EXPENSE')) {
      where.type = type;
    }
    if (search) {
      where.description = { contains: search, mode: 'insensitive' };
    }
    if (group) {
      where.group = group;
    }

    const records = await prisma.dailyFinanceTransaction.findMany({
      where,
      orderBy: { transactionDate: 'desc' }
    });

    res.json(records);
  } catch (error) {
    console.error('Get daily records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createDailyRecord = async (req, res) => {
  try {
    const { type, description, amount, transactionDate, group } = req.body;

    if (!description || amount === undefined || amount === null) {
      return res.status(400).json({ message: 'Description and amount are required' });
    }

    const record = await prisma.dailyFinanceTransaction.create({
      data: {
        type: type || 'INCOME',
        description,
        amount: parseFloat(amount),
        transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
        group: group || ''
      }
    });

    res.status(201).json(record);
  } catch (error) {
    console.error('Create daily record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateDailyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, description, amount, transactionDate, group } = req.body;

    const updateData = {};
    if (type) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (amount !== undefined) updateData.amount = parseFloat(amount);
    if (transactionDate) updateData.transactionDate = new Date(transactionDate);
    if (group !== undefined) updateData.group = group;

    const record = await prisma.dailyFinanceTransaction.update({
      where: { id },
      data: updateData
    });

    res.json(record);
  } catch (error) {
    console.error('Update daily record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteDailyRecord = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.dailyFinanceTransaction.delete({ where: { id } });
    res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error('Delete daily record error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const todayStart = toDateStart(new Date());
    const todayEnd = toDateEnd(new Date());

    const records = await prisma.dailyFinanceTransaction.findMany({
      where: {
        transactionDate: {
          gte: todayStart,
          lte: todayEnd
        }
      }
    });

    const totalIncome = records
      .filter(r => r.type === 'INCOME')
      .reduce((s, r) => s + r.amount, 0);
    const totalExpense = records
      .filter(r => r.type === 'EXPENSE')
      .reduce((s, r) => s + r.amount, 0);

    res.json({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      transactionCount: records.length
    });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getGroups = async (req, res) => {
  try {
    const groups = await prisma.transactionGroup.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(groups);
  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama grup wajib diisi' });
    }
    const existing = await prisma.transactionGroup.findUnique({
      where: { name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ message: 'Nama grup sudah ada' });
    }
    const group = await prisma.transactionGroup.create({
      data: { name: name.trim() }
    });
    res.status(201).json(group);
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Nama grup wajib diisi' });
    }
    const existing = await prisma.transactionGroup.findFirst({
      where: { name: name.trim(), NOT: { id } }
    });
    if (existing) {
      return res.status(400).json({ message: 'Nama grup sudah ada' });
    }
    const group = await prisma.transactionGroup.update({
      where: { id },
      data: { name: name.trim() }
    });
    res.json(group);
  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transactionGroup.delete({ where: { id } });
    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getDailyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate) {
      where.transactionDate = { ...where.transactionDate, gte: toDateStart(startDate) };
    }
    if (endDate) {
      where.transactionDate = { ...where.transactionDate, lte: toDateEnd(endDate) };
    }

    const records = await prisma.dailyFinanceTransaction.findMany({
      where,
      orderBy: { transactionDate: 'asc' }
    });

    const totalIncome = records
      .filter(r => r.type === 'INCOME')
      .reduce((s, r) => s + r.amount, 0);
    const totalExpense = records
      .filter(r => r.type === 'EXPENSE')
      .reduce((s, r) => s + r.amount, 0);

    res.json({
      records,
      summary: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount: records.length
      }
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
