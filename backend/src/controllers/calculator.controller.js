import { calculateProfit } from "../services/calculator.service.js";

export const profitCalculator = (req, res) => {
  try {
    const { platform, country, data } = req.body;

    const result = calculateProfit(platform, country, data);

    res.json({
      success: true,
      result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};
