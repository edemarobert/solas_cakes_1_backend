export const generateTransactionReference = () => {
    return `TX_REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  };