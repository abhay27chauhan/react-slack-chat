import { debugLog } from "./utils";

export const isValidOnlineUser = (user) => {
  return !user.is_bot;
};

export const getNewMessages = (old, total, botId) => {
  const oldText = JSON.stringify(old);
  // Message Order has to be consistent
  const differenceInMessages = total.filter(
    (i) => oldText.indexOf(JSON.stringify(i)) === -1 && i.user !== botId
  );
  return differenceInMessages;
};

export const decodeHtml = (html) => {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
};

export const isSystemMessage = (message) => {
  const systemMessageRegex = /<@.[^|]*[|].*>/;
  return (
    systemMessageRegex.test(message.text) &&
    message.text.indexOf(message.user) > -1
  );
};

export const wasIMentioned = (message, botName) => {
  const myMessage = message.username === botName;
  return !myMessage && message.text.indexOf(`@${botName}`) > -1;
};

export const isAdmin = (message) => {
  // Any post that has the `user` field is from the backend
  return typeof message.user !== "undefined";
};

export const postFile = ({ file, title, apiToken, channel, thread_ts }) => {
  return new Promise((resolve, reject) => {
    debugLog("UPLOADING", file);
    const options = {
      token: apiToken,
      title,
      filename: file.name,
      filetype: "auto",
      channels: channel,
    };
    const form = new FormData();
    form.append("token", options.token);
    form.append("filename", options.filename);
    form.append("title", options.title);
    form.append("filetype", options.filetype);
    form.append("channels", options.channels);
    form.append("file", new Blob([file]));
    form.append("thread_ts", thread_ts)
  
    const request = new XMLHttpRequest();
    request.open("POST", "https://slack.com/api/files.upload");
    request.send(form);
    request.onload = () => {
      if (request.status !== 200) {
        const error = new Error(
          "There was an error uploading the file. Response:",
          request.status,
          request.responseText
        );
        return reject(error);
      }
      return resolve();
    };
  });
};

export const hasEmoji = (text) => {
  const chatHasEmoji = /(:[:a-zA-Z/_]*:)/;
  return chatHasEmoji.test(text);
};
