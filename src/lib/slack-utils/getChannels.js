import { debugLog } from "../utils";

const getChannels = ({ apiToken, bot, channelFilter = [], defaultChannel }) => {
  return bot.conversations
    .list({
      token: apiToken,
    })
    .then((payload) => {
      debugLog(payload);
      // get the channels we need
      const channels = [];
      let activeChannel = "";

      payload.channels.forEach((channel) => {
        channelFilter.forEach((channelObject) => {
          // If this channel is exactly as requested
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
    });
};

export default getChannels;
