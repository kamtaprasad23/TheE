import amazonRules from "../rules/amazon.rules.js";
import flipkartRules from "../rules/flipkart.rules.js";
import meeshoRules from "../rules/meesho.rules.js";

export const calculateProfit = (platform, country, data) => {
  let rules;

  switch (platform) {
    case "amazon":
      rules = amazonRules;
      break;
    case "flipkart":
      rules = flipkartRules;
      break;
    case "meesho":
      rules = meeshoRules;
      break;
    default:
      throw new Error("Invalid platform");
  }

  return rules.calculate(data, country);
};
