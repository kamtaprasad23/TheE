// Flipkart, Meesho, Jiomart

export const domesticCalculatorRules = {
  flipkart: ({ price }) => {
    price = Number(price) || 0;

    const commissionFee = price * 0.15;
    const shippingFee = 50;
    const fixedFee = 20;

    const totalFees = commissionFee + shippingFee + fixedFee;
    const profit = price - totalFees;

    return {
      commissionFee,
      shippingFee,
      fixedFee,
      totalFees,
      profit,
    };
  },

  meesho: ({ costPrice, shippingCharges, gstRate = 18 }) => {
    costPrice = Number(costPrice) || 0;
    shippingCharges = Number(shippingCharges) || 0;
    gstRate = Number(gstRate) || 0;

    const gstOnCostPrice = (costPrice * gstRate) / 100;
    const sellingPriceWithoutGST = costPrice + shippingCharges;
    const sellingPriceWithGST = sellingPriceWithoutGST + gstOnCostPrice;

    return {
      costPrice,
      shippingCharges,
      gstOnCostPrice,
      sellingPriceWithoutGST,
      sellingPriceWithGST,
    };
  },

  jiomart: ({ price, gstPercentage = 18 }) => {
    price = Number(price) || 0;

    const referralFee = price * 0.12;
    const shippingFee = 40;
    const gst = ((referralFee + shippingFee) * gstPercentage) / 100;
    const totalCost = referralFee + shippingFee + gst;
    const profit = price - totalCost;

    return {
      referralFee,
      shippingFee,
      gst,
      totalCost,
      profit,
    };
  },
};
