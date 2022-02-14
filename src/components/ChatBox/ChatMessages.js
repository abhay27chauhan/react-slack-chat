import React from "react";
import classNames from "classnames";
import styled from "styled-components";
import {
  decodeHtml,
  hasAttachment,
  isSystemMessage,
  wasIMentioned,
} from "../../lib/chatFunctions";
import { bgColor, fontFamily, textColor } from "../../lib/constants";

function ChatMessages({ messages, botName, botId }) {
  const fileUploadTitle = `Posted by ${botName}`;

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
              {/* {didIPostIt && (
                // show customer image
                <UserContactPhoto
                  src={userImage || defaultChannelIcon}
                  alt="userIcon"
                />
              )} */}
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
              {/* {
                // Show remote users image only if message isn't customers
                !didIPostIt ? getUserImg(message) : null
              } */}
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
        {/* {myMessage && (
          // show customer image
          <UserContactPhoto src={userImage} alt="userIcon" />
        )} */}
        <ChatMessage
          className={classNames(
            mentioned ? "mentioned" : "",
            myMessage ? "mine" : "notMine"
          )}
        >
          {messageText}
        </ChatMessage>
        {/* {
          // Show remote users image only if message isn't customers
          !myMessage ? getUserImg(message) : null
        } */}
      </ChatMsgRow>
    );
  }
  return (
    <Messages id="widget-reactSlakChatMessages">
      {messages.map((message) => displayFormattedMessage(message))}
    </Messages>
  );
}

const Messages = styled.div`
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

export default ChatMessages;
