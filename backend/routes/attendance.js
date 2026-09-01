const express = require("express");
const Attendance = require("../models/Attendance");
const { protect, hrOnly } = require("../middleware/auth");
const { toDateStr, computeWorkingHours, deriveStatus } = require("../utils/helpers");

const router = express.Router();

// @route POST /api/attendance/checkin
router.post("/checkin", protect, async (req, res) => {
  try {
    const today = toDateStr();
    let record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (record && record.checkIn) {
      return res.status(400).json({ message: "Already checked in today" });
    }

    if (!record) {
      record = await Attendance.create({
        employee: req.user._id,
        date: today,
        checkIn: new Date(),
        status: "Present",
      });
    } else {
      record.checkIn = new Date();
      await record.save();
    }

    res.status(201).json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route POST /api/attendance/checkout
router.post("/checkout", protect, async (req, res) => {
  try {
    const today = toDateStr();
    const record = await Attendance.findOne({ employee: req.user._id, date: today });

    if (!record || !record.checkIn) {
      return res.status(400).json({ message: "You must check in before checking out" });
    }
    if (record.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    record.checkOut = new Date();
    record.workingHours = computeWorkingHours(record.checkIn, record.checkOut);
    record.status = deriveStatus(record.workingHours);
    await record.save();

    res.json({ record });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/attendance/me?month=YYYY-MM
router.get("/me", protect, async (req, res) => {
  try {
    const { month } = req.query;
    const filter = { employee: req.user._id };
    if (month) {
      filter.date = { $regex: `^${month}` };
    }
    const records = await Attendance.find(filter).sort({ date: -1 });

    const totalHours = records.reduce((sum, r) => sum + (r.workingHours || 0), 0);
    const presentDays = records.filter((r) => r.status === "Present").length;

    res.json({ records, summary: { totalHours: Math.round(totalHours * 100) / 100, presentDays, totalRecords: records.length } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/attendance/today
router.get("/today", protect, async (req, res) => {
  try {
    const today = toDateStr();
    const record = await Attendance.findOne({ employee: req.user._id, date: today });
    res.json({ record: record || null });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/attendance/all?date=YYYY-MM-DD  (HR only)
router.get("/all", protect, hrOnly, async (req, res) => {
  try {
    const { date, month, employeeId } = req.query;
    const filter = {};
    if (date) filter.date = date;
    else if (month) filter.date = { $regex: `^${month}` };
    if (employeeId) filter.employee = employeeId;

    const records = await Attendance.find(filter)
      .populate("employee", "name email department designation employeeId")
      .sort({ date: -1 });

    res.json({ records });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
