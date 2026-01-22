export const processEmptyBoxClaim = (file) => {
  // TODO:
  // 1. Read invoice / order PDF
  // 2. Extract order ID, tracking
  // 3. Generate claim format
  return {
    status: "pending",
    message: "Empty box claim generated (logic pending)"
  };
};

export const captureMissingPayments = (file) => {
  // TODO:
  // Parse settlement report
  // Detect missing payments
  return {
    missingPayments: [],
    message: "Missing payment scan completed (logic pending)"
  };
};
