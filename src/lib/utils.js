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

const calculateYesterdayDate = () => {
  let date = new Date();
  date.setDate(new Date().getDate() - 1);
  return date.toDateString();
};

const formatDate = (date) => {
  const d = new Date(date);

  let month = "" + (d.getMonth() + 1);
  let day = "" + d.getDate();
  const year = d.getFullYear();

  if (month.length < 2) month = "0" + month;
  if (day.length < 2) day = "0" + day;

  return [month, day, year].join("/");
};

export const generateDateStamp = (timeStamp, forChatBox) => {
  if (timeStamp == undefined) return "";
  const todayDate = new Date().toDateString();
  const yesterdayDate = calculateYesterdayDate();

  const today = todayDate.slice(0, todayDate.length - 5);
  const yesterday = yesterdayDate.slice(0, yesterdayDate.length - 5);
  const messageDateString = new Date(timeStamp)
      .toDateString()
      .slice(0, todayDate.length - 5);
  if (new Date(timeStamp).getFullYear() === new Date().getFullYear()) {
      if (messageDateString === today) {
          return forChatBox ? "Today" : formatAMPM(timeStamp);
      } else if (messageDateString === yesterday) {
          return "Yesterday";
      } else {
          return forChatBox ? messageDateString : formatDate(timeStamp);
      }
  } else {
      return formatDate(timeStamp);
  }
};

export const arraysIdentical = (a, b) => {
  return JSON.stringify(a) === JSON.stringify(b);
};
