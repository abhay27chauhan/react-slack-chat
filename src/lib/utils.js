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

export function formatAMPM(value) {
  if (!value) return;

  const date = new Date(value*1000)
  let hours = date?.getHours();
  let minutes = date?.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  const strTime = hours + ":" + minutes + " " + ampm;
  return strTime;
}

export const arraysIdentical = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
