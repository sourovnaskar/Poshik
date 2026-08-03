const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pet",
      required: true,
      index: true,
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    schedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DoctorSchedule",
      required: true,
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      required: [true, "Appointment reason is required"],
      maxlength: 1000,
    },

    consultationFee: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Rejected", "Completed", "Cancelled"],
      default: "Confirmed",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);
appointmentSchema.index({ owner: 1, pet: 1, schedule: 1 }, { unique: true });
module.exports = mongoose.model("Appointment", appointmentSchema);
