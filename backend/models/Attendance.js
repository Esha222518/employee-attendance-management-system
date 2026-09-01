const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true }, // YYYY-MM-DD, one record per employee per day
    checkIn: { type: Date },
    checkOut: { type: Date },
    workingHours: { type: Number, default: 0 }, // decimal hours
    status: {
      type: String,
      enum: ["Present", "Absent", "Half Day", "Late", "On Leave"],
      default: "Present",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
