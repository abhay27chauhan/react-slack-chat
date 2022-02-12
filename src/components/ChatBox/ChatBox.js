import React from "react";
import styled from "styled-components";
import classNames from "classnames";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import ChatHeader from "./ChatHeader";
import defaultChannelIcon from "../../assets/team.svg";
import {
  decodeHtml,
  hasAttachment,
  isAdmin,
  isSystemMessage,
  wasIMentioned,
} from "../../lib/chatFunctions";
import ChatFooter from "./ChatFooter";

function ChatBox({
  activeChannelRef,
  goToChannelView,
  messages,
  closeChatBox,
  closeChatButton,
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
  const fileUploadTitle = `Posted by ${botName}`;

  function getUserImg(message) {
    const userId = message.user || message.username;
    let image;
    onlineUsers.forEach((user) => {
      if (user.id === userId) {
        image = user.image;
      }
    });
    const imageToReturn = image ? (
      // Found backend user
      <ChatContactPhoto src={image} alt="mentionedUserImg" />
    ) : // Check admin or client user?
    isAdmin(message) ? (
      <ChatContactPhoto
        src={`https://robohash.org/${userId}?set=set2`}
        alt={userId}
      />
    ) : // Check system message or client user?
    isSystemMessage(message) ? (
      <ChatContactPhoto
        src={`https://robohash.org/${userId}?set=set3`}
        alt={userId}
      />
    ) : (
      // Regular browser client user
      <ChatContactPhoto src={`https://robohash.org/${userId}`} alt={userId} />
    );
    return imageToReturn;
  }

  function displayFormattedMessage(message) {
    // decode formatting from messages text to html text
    let messageText = decodeHtml(message.text);
    // who's message is this?
    const myMessage = message.user === botId;
    // Check to see if this is a Slack System message?
    if (isSystemMessage(message)) {
      // message.text is a system message
      // try to see if it has an attachment in it
      const attachmentFound = hasAttachment(message.text);
      if (attachmentFound && attachmentFound[0]) {
        // An attachment is found
        // Point to file available for download
        if (attachmentFound[1]) {
          // image file found
          const didIPostIt = message.text.indexOf(fileUploadTitle) > -1;
          const fileNameFromUrl = attachmentFound[1].split("/");
          return (
            <ChatMsgRow
              className={classNames(didIPostIt ? "mine" : "notMine")}
              key={message.ts}
            >
              {didIPostIt && (
                // show customer image
                <UserContactPhoto
                  src={userImage || defaultChannelIcon}
                  alt="userIcon"
                />
              )}
              <ChatMessage
                className={classNames(didIPostIt ? "mine" : "notMine")}
              >
                <strong>Sent an Attachment: </strong>
                <span>{fileNameFromUrl[fileNameFromUrl.length - 1]}</span>
                <hr />
                <a href={attachmentFound[1]} target="_blank" rel="noreferrer">
                  <span>Click to Download</span>
                </a>
              </ChatMessage>
              {
                // Show remote users image only if message isn't customers
                !didIPostIt ? getUserImg(message) : null
              }
            </ChatMsgRow>
          );
        }
      }
      // else we display a system message that doesn't belong to
      // anyone
      return (
        <ChatMsgRow key={message.ts}>
          <ChatMessage
            className="system__message"
            dangerouslySetInnerHTML={{ __html: messageText }}
          />
        </ChatMsgRow>
      );
    }

    // check if user was mentioned by anyone else remotely
    const mentioned = wasIMentioned(message, botName);

    return (
      <ChatMsgRow
        className={classNames(myMessage ? "mine" : "notMine")}
        key={message.ts}
      >
        {myMessage && (
          // show customer image
          <UserContactPhoto src={userImage} alt="userIcon" />
        )}
        <ChatMessage
          className={classNames(
            mentioned ? "mentioned" : "",
            myMessage ? "mine" : "notMine"
          )}
        >
          {messageText}
        </ChatMessage>
        {
          // Show remote users image only if message isn't customers
          !myMessage ? getUserImg(message) : null
        }
      </ChatMsgRow>
    );
  }

  return (
    <Chat className="chat">
      <ChatHeader
        activeChannelRef={activeChannelRef}
        goToChannelView={goToChannelView}
        closeChatButton={closeChatButton}
        closeChatBox={closeChatBox}
      />
      <ChatMessages id="widget-reactSlakChatMessages">
        {messages.map((message) => displayFormattedMessage(message))}
      </ChatMessages>
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

const ChatMessages = styled.div`
  position: absolute;
  top: 60px;
  height: 68%;
  width: 96%;
  padding-top: 35px;
  padding-right: 10px;
  padding-left: 10px;
  overflow-y: auto;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChatMsgRow = styled.div`
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;

  &::after {
    content: "";
    display: table;
    clear: both;
  }

  &.mine {
    text-align: left;
  }

  &.notMine {
    text-align: right;

    .mentioned {
      background: ${bgColor.colorPictonBlue} no-repeat -2px -2px !important;
      color: ${textColor.textWhite} !important;
    }
  }
`;

const ChatMessage = styled.div`
  display: inline-block;
  max-width: 60%;
  word-wrap: break-word;
  margin-right: 10px;
  padding: 0.8rem;
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  border-radius: 5px;
  color: ${textColor.textPrimaryBlue};

  &.mine {
    background-color: ${bgColor.bgBluishWhite};
  }
  &.notMine {
    background-color: ${bgColor.bgLightGray};
  }
`;

const UserContactPhoto = styled.img`
  float: left;
  margin-top: 2px;
  padding-bottom: 1px;
  height: 38px;
  border-radius: 50%;
  margin-right: 10px;
`;

const ChatContactPhoto = styled.img`
  border-radius: 50%;
  height: 38px;
  float: right;
`;

export default ChatBox;
