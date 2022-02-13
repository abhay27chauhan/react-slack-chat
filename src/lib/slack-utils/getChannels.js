import { debugLog, errorLogger } from "../utils";

const getChannels = ({ apiToken, bot, channelFilter = [], defaultChannel }) => {
  return bot.conversations
    .list({
      token: apiToken,
    })
    .then((payload) => {
      debugLog(payload);

      const channels = [];
      let activeChannel = {};

      payload.channels.forEach((channel) => {
        channelFilter.forEach((channelObject) => {
          if (
            channelObject.name === channel.name ||
            channelObject.id === channel.id
          ) {
            if (defaultChannel === channel.name) {
              activeChannel = channelObject;
            }
            channel.icon = channelObject.icon; // Add on the icon property to the channel list
            channels.push(channel);
          }
        });
      });
      return { channels, activeChannel };
    })
    .catch((err) => {
      errorLogger("get channels", err);
      throw err;
    });
};

export default getChannels;
