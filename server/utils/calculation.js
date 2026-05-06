export const calculateDeduction = (amount, percentage) => {
  const deduction = (amount * percentage) / 100;
  const netAmount = amount - deduction;
  return {
    amount,
    deduction,
    netAmount
  };
};
