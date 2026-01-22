import mongoose from "mongoose";

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },

    country: {
      type: String,
      enum: ["IN", "UK", "US"],
      default: "IN",
    },

    source: {
      type: String,
      required: true,   // amazon-fba-in / flipkart / meesho
    },

    marketplace: {
      type: String,
      enum: ["amazon", "flipkart", "meesho", "jiomart"],
    },

    calculatorType: {
      type: String, // fba / price / fees
    },

    message: { type: String },

    metadata: {
      type: Object, // price, weight, profit etc (optional)
    },
  },
  { timestamps: true }
);

export default mongoose.model("Lead", leadSchema);
