// utils/calculatorRules.js
import { domesticCalculatorRules as domestic } from "../rules/domesticCalculator.rules.js";
import { fbaCalculatorRules as fba } from "../rules/fbaCalculator.rules.js";
import { internationalCalculatorRules as international } from "../rules/internationalCalculator.rules.js";
import { otherCalculatorRules as other } from "../rules/otherCalculator.rules.js";

const RULE_MAP = {
  domestic,
  fba,
  international,
  other,
};

export const calculatorRules = RULE_MAP;
export const getCalculatorRule = (type) => RULE_MAP[type];
