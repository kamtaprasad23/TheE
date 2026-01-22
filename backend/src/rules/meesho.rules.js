export default {
  calculate(data) {
    const shipping = Number(data.shipping || 0);

    return {
      shipping,
      profit: data.price - shipping
    };
  }
};
