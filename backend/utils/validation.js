// utils/validation.js
class ClientError extends Error {
  constructor(message) {
    super(message);
    this.isClientError = true;
  }
}

const validateMinYear = (minYear) => {
  if (minYear && (minYear < 1887 || minYear > 2025)) {
    throw new ClientError('minYear must be between 1887 and 2025');
  }
};

module.exports = { validateMinYear };
