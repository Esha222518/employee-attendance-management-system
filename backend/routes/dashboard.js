const express = require("express");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const Leave = require("../models/Leave");
const { protect, hrOnly } = require("../middleware/auth");
const { toDateStr } = require("../utils/helpers");

const router = express.Router();

// @route GET /api/dashboard/employee - summary for logged-in employee
router.get("/employee", protect, async (req, res) => {
  try {
    const today = toDateStr();
    const monthPrefix = today.slice(0, 7);

    const todayRecord = await Attendance.findOne({ employee: req.user._id, date: today });
    const monthRecords = await Attendance.find({
      employee: req.user._id,
      date: { $regex: `^${monthPrefix}` },
    });

    const totalHours = monthRecords.reduce((s, r) => s + (r.workingHours || 0), 0);
    const presentDays = monthRecords.filter((r) => r.status === "Present").length;
    const leaveDays = monthRecords.filter((r) => r.status === "On Leave").length;

    const pendingLeaves = await Leave.countDocuments({ employee: req.user._id, status: "Pending" });

    res.json({
      today: todayRecord,
      monthSummary: {
        month: monthPrefix,
        totalHours: Math.round(totalHours * 100) / 100,
        presentDays,
        leaveDays,
        totalRecords: monthRecords.length,
      },
      pendingLeaves,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/dashboard/hr - org-wide summary (HR only)
router.get("/hr", protect, hrOnly, async (req, res) => {
  try {
    const today = toDateStr();
    const totalEmployees = await User.countDocuments({ role: "employee", isActive: true });

    const todayRecords = await Attendance.find({ date: today });
    const presentToday = todayRecords.filter((r) => ["Present", "Late", "Half Day"].includes(r.status)).length;
    const onLeaveToday = todayRecords.filter((r) => r.status === "On Leave").length;

    const pendingLeaves = await Leave.countDocuments({ status: "Pending" });

    const recentLeaves = await Leave.find({ status: "Pending" })
      .populate("employee", "name department")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalEmployees,
      presentToday,
      absentToday: Math.max(0, totalEmployees - presentToday - onLeaveToday),
      onLeaveToday,
      pendingLeaves,
      recentLeaves,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/dashboard/employees (HR only) - list all employees
router.get("/employees", protect, hrOnly, async (req, res) => {
  try {
    const employees = await User.find({ role: "employee" }).sort({ name: 1 });
    res.json({ employees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
