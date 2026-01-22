// Amazon US / UK, eBay, Walmart, Etsy, Alibaba

export const internationalCalculatorRules = {
  amazon: ({ price }) => {
    price = Number(price) || 0;

    const referralFee = price * 0.15;
    const fulfillmentFee = 5;
    const totalFees = referralFee + fulfillmentFee;
    const profit = price - totalFees;

    return {
      referralFee,
      fulfillmentFee,
      totalFees,
      profit,
    };
  },

  ebay: ({ price }) => {
    price = Number(price) || 0;

    const finalValueFee = price * 0.13;
    const totalFees = finalValueFee;
    const profit = price - totalFees;

    return {
      finalValueFee,
      totalFees,
      profit,
    };
  },

  walmart: ({ price }) => {
    price = Number(price) || 0;

    const referralFee = price * 0.15;
    const profit = price - referralFee;

    return {
      referralFee,
      profit,
    };
  },

  etsy: ({ price }) => {
    price = Number(price) || 0;

    const transactionFee = price * 0.065;
    const processingFee = price * 0.03;
    const totalFees = transactionFee + processingFee;
    const profit = price - totalFees;

    return {
      transactionFee,
      processingFee,
      totalFees,
      profit,
    };
  },

  alibaba: ({ price }) => {
    price = Number(price) || 0;

    const serviceFee = price * 0.05;
    const profit = price - serviceFee;

    return {
      serviceFee,
      profit,
    };
  },
};
