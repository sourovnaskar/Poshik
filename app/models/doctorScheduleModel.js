const mongoose = require("mongoose");

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    startTime: {
      type: String,
      required: true,
      trim: true,
    },

    endTime: {
      type: String,
      required: true,
      trim: true,
    },

    maxPatients: {
      type: Number,
      required: true,
      min: 1,
    },
    bookedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Prevent duplicate slot for same doctor/date/time
doctorScheduleSchema.index(
  {
    doctor: 1,
    date: 1,
    startTime: 1,
    endTime: 1,
  },
  {
    unique: true,
  },
);

module.exports = mongoose.model("DoctorSchedule", doctorScheduleSchema);
