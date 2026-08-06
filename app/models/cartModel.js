const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "User",

      required: true,

      unique: true,

      index: true,
    },

    // NEW: The whole cart belongs to ONE shop at a time

    activeShop: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Shop",

      default: null, // Null means the cart is empty
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,

          ref: "Product",

          required: true,
        },

        quantity: {
          type: Number,

          required: true,

          min: 1,
        },
      },
    ],
  },

  { timestamps: true },
);

module.exports = mongoose.model("Cart", cartSchema);
