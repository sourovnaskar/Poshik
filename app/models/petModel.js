const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Pet name is required"],
      trim: true,
      maxlength: 100,
    },

    species: {
      type: String,
      required: true,
      enum: ["Dog", "Cat", "Bird", "Small Pet","Fish" ,"Other"],
    },

    breed: {
      type: String,
      trim: true,
    },

    gender: {
      type: String,
      enum: ["Male", "Female","Unknown"],
    },

    age: {
      type: Number,
      min: 0,
    },

    weight: {
      type: Number,
      min: 0,
    },

    color: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
      default: null,
    },

    bio: {
      type: String,
      maxlength: 500,
    },

    vaccinationDetails: {
      type: String,
    },

    medicalHistory: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Pet", petSchema);