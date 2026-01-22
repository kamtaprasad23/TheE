// Amazon FBA (IN / UK / US – country param se handle hoga)

export const fbaCalculatorRules = {
  amazon: ({ price, gstPercentage = 18 }) => {
    price = Number(price) || 0;

    const referralFee = price * 0.15;
    const closingFee = 25;
    const shippingFee = 50;

    const totalFees = referralFee + closingFee + shippingFee;
    const gst = (totalFees * gstPercentage) / 100;
    const totalCost = totalFees + gst;
    const profit = price - totalCost;

    return {
      referralFee,
      closingFee,
      shippingFee,
      totalFees,
      gst,
      totalCost,
      profit,
    };
  },
};
