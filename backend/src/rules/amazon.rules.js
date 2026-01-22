export default {
  calculate(data) {
    const referralFee = data.price * 0.15;
    const shippingFee = 50;
    const gst = (referralFee + shippingFee) * 0.18;

    return {
      referralFee,
      shippingFee,
      gst,
      totalCost: referralFee + shippingFee + gst,
      profit: data.price - (referralFee + shippingFee + gst)
    };
  }
};
