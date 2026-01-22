export default {
  calculate(data) {
    const commission = data.price * 0.12;
    const logistics = 60;

    return {
      commission,
      logistics,
      profit: data.price - (commission + logistics)
    };
  }
};
