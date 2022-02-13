export const debugLog = (...args) => {
  if (process.env.NODE_ENV !== "production") {
    return console.log("[ReactSlackChat]", ...args);
  }
};

export function errorLogger(functionName, error) {
  console.trace(
      "Error at: ",
      functionName,
      "\n",
      "ErrorResponse: ",
      error,
      "\n\n",
  );
}

export const arraysIdentical = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
