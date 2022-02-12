import { debugLog } from "../utils";

import { isValidOnlineUser } from "../chatFunctions";
import User from "../User/User";

const getUsers = ({ apiToken, bot }) => {
  return bot.users.list({ token: apiToken }).then((payload) => {
    debugLog(payload);
    // Create new User object for each online user found
    // Add to our list only if the user is valid
    const onlineUsers = [];
    // extract and resolve return the users
    payload.members.forEach((user) =>
      isValidOnlineUser(user) && onlineUsers.push(new User(user))
    );

    return { onlineUsers };
  });
};

export default getUsers;
