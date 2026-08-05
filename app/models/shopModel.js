const mongoose = require("mongoose");

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    shopName: {
      type: String,
      required: [true, "Shop name is required"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      maxlength: 1000,
    },

    phone: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    logo: {
      type: String,
      default: null,
    },

    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shop", shopSchema);