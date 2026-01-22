// Age, Discount, Finance Margin, Volumetric Weight, Pythagorean

export const otherCalculatorRules = {
  age: ({ birthYear, currentYear }) => {
    return {
      age: currentYear - birthYear,
    };
  },

  discount: ({ price, discountPercent }) => {
    const discount = (price * discountPercent) / 100;
    const finalPrice = price - discount;

    return {
      discount,
      finalPrice,
    };
  },

  financeMargin: ({ costPrice, sellingPrice }) => {
    const profit = sellingPrice - costPrice;
    const margin = sellingPrice
      ? (profit / sellingPrice) * 100
      : 0;
    const markup = costPrice
      ? (profit / costPrice) * 100
      : 0;

    return {
      profit,
      margin,
      markup,
    };
  },

  volumetricWeight: ({ length, width, height, factor = 5000 }) => {
    const volumetricWeight = (length * width * height) / factor;

    return {
      volumetricWeight,
    };
  },

  pythagorean: ({ a, b }) => {
    const c = Math.sqrt(a * a + b * b);
    return { c };
  },
};
