const express = require("express");
const Leave = require("../models/Leave");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const { protect, hrOnly } = require("../middleware/auth");
const { countDaysInclusive, computeLeaveDeduction } = require("../utils/helpers");

const router = express.Router();

// @route POST /api/leave/apply
router.post("/apply", protect, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ message: "startDate, endDate and reason are required" });
    }
    const days = countDaysInclusive(startDate, endDate);
    if (days <= 0) {
      return res.status(400).json({ message: "endDate must be on/after startDate" });
    }

    const leave = await Leave.create({
      employee: req.user._id,
      startDate,
      endDate,
      days,
      reason,
    });

    res.status(201).json({ leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/leave/me
router.get("/me", protect, async (req, res) => {
  try {
    const leaves = await Leave.find({ employee: req.user._id }).sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/leave/all (HR only)
router.get("/all", protect, hrOnly, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const leaves = await Leave.find(filter)
      .populate("employee", "name email department designation employeeId")
      .sort({ createdAt: -1 });
    res.json({ leaves });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route PUT /api/leave/:id/review (HR only) - approve or reject
router.put("/:id/review", protect, hrOnly, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be Approved or Rejected" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave request not found" });

    leave.status = status;
    leave.reviewedBy = req.user._id;
    leave.reviewNote = reviewNote || "";
    await leave.save();

    // Mark corresponding attendance records as "On Leave" when approved
    if (status === "Approved") {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        await Attendance.findOneAndUpdate(
          { employee: leave.employee, date: dateStr },
          { employee: leave.employee, date: dateStr, status: "On Leave" },
          { upsert: true }
        );
      }
    }

    res.json({ leave });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @route GET /api/leave/deduction/:employeeId?month=YYYY-MM  (HR only)
// Calculates unpaid-leave salary deduction for an employee for a given month
router.get("/deduction/:employeeId", protect, hrOnly, async (req, res) => {
  try {
    const { month } = req.query; // YYYY-MM
    if (!month) return res.status(400).json({ message: "month query param (YYYY-MM) is required" });

    const employee = await User.findById(req.params.employeeId);
    if (!employee) return res.status(404).json({ message: "Employee not found" });

    const leaves = await Leave.find({
      employee: employee._id,
      status: "Approved",
      startDate: { $regex: `^${month}` },
    });

    const approvedDaysInMonth = leaves.reduce((sum, l) => sum + l.days, 0);
    const result = computeLeaveDeduction(approvedDaysInMonth, employee.monthlySalary || 30000);

    res.json({
      employee: { id: employee._id, name: employee.name, monthlySalary: employee.monthlySalary },
      month,
      approvedDaysInMonth,
      ...result,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
