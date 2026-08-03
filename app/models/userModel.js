const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default:
        "https://i.pinimg.com/236x/13/74/20/137420f5b9c39bc911e472f5d20f053e.jpg?nii=t",
    },
    role: {
      type: String,
      enum: ["Owner", "Doctor", "Shop", "Admin"],
      required: true,
    },

    kycStatus: {
      type: String,
      enum: [
        "Not Applicable",
        "Not Submitted",
        "Pending",
        "Approved",
        "Rejected",
      ],
      default: "Not Applicable",
    },
    isEmailVerify: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
