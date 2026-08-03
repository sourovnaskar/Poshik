const mongoose = require("mongoose");

const kycDocumentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    idType: {
      type: String,
      enum: ["Aadhaar", "Voter", "Pan"],
      required: true,
    },

    idProof: {
      type: String, //cloudinary image url
      required: [true, "ID proof is required"],
    },

    license: {
      type: String, //cloudinary image url
    },

    certificate: {
      type: String, //cloudinary image url
    },

    addressProofType: {
      type: String,
      enum: ["Aadhaar", "Voter", "Pan"],
      required: true,
    },
    addressProof: {
      type: String, //cloudinary image url
      required: [true, "Address proof is required"],
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
    },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("KycDocument", kycDocumentSchema);
