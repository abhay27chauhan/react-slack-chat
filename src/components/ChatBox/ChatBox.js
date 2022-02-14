import React from "react";
import styled from "styled-components";

import ChatHeader from "./ChatHeader";
import ChatFooter from "./ChatFooter";
import ChatMessages from "./ChatMessages";

function ChatBox({
  activeChannelRef,
  messages,
  bot,
  singleUserMode,
  TS_MAP,
  apiToken,
  botName,
  refreshTime,
  userImage,
  botId,
  onlineUsers,
}) {

  return (
    <Chat className="chat">
      <ChatHeader
        activeChannelRef={activeChannelRef}
      />
      <ChatMessages
        messages={messages}
        botName={botName}
        botId={botId}
      />
      <ChatFooter
        bot={bot}
        singleUserMode={singleUserMode}
        TS_MAP={TS_MAP}
        apiToken={apiToken}
        botName={botName}
        refreshTime={refreshTime}
        activeChannelRef={activeChannelRef}
      />
    </Chat>
  );
}

const Chat = styled.div`
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.5s linear;
`;

export default ChatBox;
