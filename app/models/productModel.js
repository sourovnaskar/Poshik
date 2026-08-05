const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    shop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: 200,
    },

    description: {
      type: String,
      maxlength: 2000,
    },

    mrp: {
      type: Number,
      required: [true, "Maximum Retail Price (MRP) is required"],
      min: 0,
    },

    price: {
      type: Number,
      required: [true, "Actual selling price is required"],
      min: 0,
    },

    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    images: [
      {
        type: String,
        required: [true, "At least one product image is required"],
      },
    ],

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


productSchema.index({
  shop: 1,
  name: 1,
});

module.exports = mongoose.model("Product", productSchema);