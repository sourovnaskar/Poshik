const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: 100,
      
    },

    image: {
      type: String,
      default: null,
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


categorySchema.index({ shop: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);