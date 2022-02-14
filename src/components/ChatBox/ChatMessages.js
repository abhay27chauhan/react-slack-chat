import React, { useEffect, useRef } from "react";
import classNames from "classnames";
import styled from "styled-components";
import { load as emojiLoader, parse as emojiParser } from "gh-emoji";

import {
  decodeHtml,
  hasEmoji,
  isSystemMessage,
  wasIMentioned,
} from "../../lib/chatFunctions";
import { bgColor, fontFamily, textColor } from "../../lib/constants";
import { debugLog, formatAMPM, generateDateStamp } from "../../lib/utils";

function ChatMessages({ messages, botName, botId }) {
  const messageEmojiFormatter = useRef({ emoji: false });
  const lastMessageTimestampRef = useRef(null);
  lastMessageTimestampRef.current = null;

  const showDateLabel = (timestamp) => {
    const messageDateString = new Date(timestamp * 1000).toDateString();
    const messageDate = messageDateString.slice(
      0,
      messageDateString.length - 5
    );

    if (lastMessageTimestampRef.current === messageDate) {
      lastMessageTimestampRef.current = messageDate;
      return false;
    } else {
      lastMessageTimestampRef.current = messageDate;
      return true;
    }
  };

  function displayFormattedMessage(message) {
    // decode formatting from messages text to html text
    let messageText = decodeHtml(message.text);

    // who's message is this?
    const myMessage = message.user === botId;

    const attachmentFound = message.files && Array.isArray(message.files);
    if (attachmentFound && message.files.length > 0) {
      // An attachment is found
      return (
        <ChatMsgRow
          className={classNames(myMessage ? "mine" : "notMine")}
          key={message.ts}
        >
          {myMessage && <span>{formatAMPM(message.ts)}</span>}
          <ChatMessage className={classNames(myMessage ? "mine" : "notMine")}>
            <strong>Sent an Attachment: </strong>
            {message.files.map((file, i) => (
              <div key={i}>
                <span>{file.name}</span>
                <hr />
                <a
                  href={file.url_private_download}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span>Click to Download</span>
                </a>
              </div>
            ))}
          </ChatMessage>
          {!myMessage && <span>{formatAMPM(message.ts)}</span>}
        </ChatMsgRow>
      );
    }
    // Check to see if this is a Slack System message?
    if (isSystemMessage(message)) {
      // message.text is a system message
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

    const textHasEmoji = hasEmoji(messageText);
    // check if emoji library is enabled
    if (messageEmojiFormatter.current.emoji && textHasEmoji) {
      // parse plain text to emoji
      messageText = emojiParser(messageText);
    }

    return (
      <ChatMsgRow
        className={classNames(myMessage ? "mine" : "notMine")}
        key={message.ts}
      >
        {myMessage && (
          // show customer image
          <span>{formatAMPM(message.ts)}</span>
        )}
        {textHasEmoji ? (
          <ChatMessage
            className={classNames(
              mentioned ? "mentioned" : "",
              myMessage ? "mine" : "notMine"
            )}
            dangerouslySetInnerHTML={{ __html: messageText }}
          />
        ) : (
          <ChatMessage
            className={classNames(
              mentioned ? "mentioned" : "",
              myMessage ? "mine" : "notMine"
            )}
          >
            {messageText}
          </ChatMessage>
        )}
        {!myMessage && <span>{formatAMPM(message.ts)}</span>}
      </ChatMsgRow>
    );
  }

  useEffect(() => {
    emojiLoader()
      .then(() => {
        messageEmojiFormatter.current = {
          emoji: true,
        };
      })
      .catch((err) => debugLog(`Cant initiate emoji library ${err}`));
  }, []);

  return (
    <Messages id="widget-reactSlakChatMessages">
      {messages.map((message) => {
        return (
          <React.Fragment key={message.ts}>
            {showDateLabel(message.ts) && (
              <DateLabelContainer>
                <DateLabel>
                  {generateDateStamp(message.ts * 1000, true)}
                </DateLabel>
              </DateLabelContainer>
            )}
            {displayFormattedMessage(message)}
          </React.Fragment>
        );
      })}
    </Messages>
  );
}

const Messages = styled.div`
  position: absolute;
  top: 60px;
  height: 69%;
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

const DateLabelContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 20px 0;
`;

const DateLabel = styled.div`
  padding: 5px 12px 6px;
  text-align: center;
  background-color: #35589a;
  border-radius: 7.5px;
  color: white;
`;

const ChatMsgRow = styled.div`
  margin-top: 0.7rem;
  margin-bottom: 0.7rem;
  display: flex;
  align-items: center;
  gap: 10px;

  &::after {
    content: "";
    display: table;
    clear: both;
  }

  img {
    height: 20px;
    position: relative;
    top: 4px;
  }

  & > span {
    color: #aeb0b5;
    font-size: 12px;
  }

  &.mine {
    justify-content: flex-start;
  }

  &.notMine {
    justify-content: flex-end;

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
  padding: 0.8rem;
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  color: ${textColor.textPrimaryBlue};

  &.mine {
    background-color: ${bgColor.bgBluishWhite};
    border-radius: 22px 22px 22px 0px;
  }
  &.notMine {
    background-color: #537af2;
    color: #ffffff;
    border-radius: 22px 22px 0px 22px;
  }
`;

export default ChatMessages;
