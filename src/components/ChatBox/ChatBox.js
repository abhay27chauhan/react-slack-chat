import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import classNames from "classnames";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import defaultChannelIcon from "../../assets/team.svg";
import { GrAttachment } from "react-icons/gr";
import { AiFillStar } from "react-icons/ai";
import { saveChannelMap } from "../../lib/cachedChannelMap";
import { debugLog } from "../../lib/utils";
import { postMessage } from "../../lib/slack-utils";
import {
  decodeHtml,
  hasAttachment,
  isAdmin,
  isSystemMessage,
  postFile,
  wasIMentioned,
} from "../../lib/chatFunctions";

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
  const [postMyMessage, setPostMyMessage] = useState("");
  const [inputDisabed, setInputDisabled] = useState(false);
  const [fileUploadLoader, setFileUploadLoader] = useState(false);
  const [postMyFile, setPostMyFile] = useState("");
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

  function handleFileChange(e) {
    debugLog("Going to upload", e.target.value, e.target);
    const fileToUpload = document.getElementById("chat__upload").files[0];
    setFileUploadLoader(true);
    setPostMyFile(e.target.value);
    postFile({
      file: fileToUpload,
      title: fileUploadTitle,
      apiToken: apiToken,
      channel: activeChannelRef.current.id,
    })
      .then(() => {
        setFileUploadLoader(false);
        setPostMyFile("");
      })
      .catch((err) => {
        debugLog("Could not post file", err);
      });
  }

  function postNewMessage() {
    setInputDisabled(true);
    const textMessage = postMyMessage;
    setPostMyMessage("");
    return postMessage({
      bot: bot.current,
      text: textMessage,
      singleUserMode: singleUserMode,
      ts: TS_MAP.current[
        activeChannelRef.current?.name || activeChannelRef.current?.id
      ],
      apiToken: apiToken,
      channel: activeChannelRef.current?.id,
      username: botName,
    })
      .then((data) => {
        // single user and no ts thread info stored
        setInputDisabled(false);
        if (
          singleUserMode &&
          !TS_MAP.current[
            activeChannelRef.current?.name || activeChannelRef.current?.id
          ]
        ) {
          TS_MAP.current[
            activeChannelRef.current?.name || activeChannelRef.current?.id
          ] = data.message.thread_ts || data.ts;
          // update cache map
          saveChannelMap({ TS_MAP: TS_MAP.current });
        }
        setTimeout(() => {
          const chatMessages = document.getElementById(
            "widget-reactSlakChatMessages"
          );
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }, refreshTime);
      })
      .catch((err) => {
        setInputDisabled(false);
        if (err) {
          return debugLog("failed to post. Err:", err);
        }
        return null;
      });
  }
  return (
    <Chat className="chat">
      <ChatHeader>
        <ChatBack onClick={goToChannelView} />
        <ChatPerson>
          <ChatStatus>status</ChatStatus>
          <ChatOnline className="active" />
          <ChatName>{activeChannelRef.current?.name}</ChatName>
        </ChatPerson>
        <ChannelHeaderPhoto
          src={activeChannelRef.current?.icon || defaultChannelIcon}
          alt="active channel icon"
        />
        {closeChatButton && <CloseButton onClick={closeChatBox}>×</CloseButton>}
      </ChatHeader>
      <ChatMessages id="widget-reactSlakChatMessages">
        {messages.map((message) => displayFormattedMessage(message))}
      </ChatMessages>
      <div>
        {fileUploadLoader && (
          <ChatFileUpload>
            <span>Uploading</span>
          </ChatFileUpload>
        )}
        {!fileUploadLoader && (
          <div>
            <div>
              <AttachmentIcon htmlFor="chat__upload">
                <GrAttachment />
                <input
                  type="file"
                  id="chat__upload"
                  className="chat__upload"
                  value={postMyFile}
                  onChange={handleFileChange}
                />
              </AttachmentIcon>
            </div>
            <ChatInput
              type="text"
              id="chat__input__text"
              value={postMyMessage}
              placeholder="Enter your message..."
              disabled={inputDisabed}
              onKeyPress={(e) => e.key === "Enter" && postNewMessage()}
              onChange={(e) => setPostMyMessage(e.target.value)}
            />
          </div>
        )}
      </div>
    </Chat>
  );
}

const Chat = styled.div`
  visibility: hidden;
  opacity: 0;
  transition: visibility 0s, opacity 0.5s linear;
`;

const ChatHeader = styled.div`
  position: absolute;
  top: 0px;
  z-index: 9999;
  left: 0rem;
  width: 100%;
  height: 6rem;
  background: ${bgColor.themeColor};
`;

const ChatBack = styled.span`
  &::before {
    content: "";
    position: absolute;
    display: block;
    cursor: pointer;
    top: 2.4rem;
    left: 1.6rem;
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid ${textColor.colorCelesteApprox};
    border-right: none;
    border-bottom: none;
    transform: rotate(-45deg);
    transition: transform 0.3s;
  }

  &:hover::before {
    transform: translateX(-0.3rem) rotate(-45deg);
  }
`;

const ChatPerson = styled.div`
  display: inline-block;
  position: absolute;
  top: 2rem;
  left: 3rem;
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  color: ${textColor.textWhite};
`;

const ChatStatus = styled.span`
  position: relative;
  left: 40px;
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  color: ${textColor.textWhite};
  text-transform: uppercase;
`;

const ChatOnline = styled.span`
  position: absolute;
  left: 20px;
  top: 5px;
  width: 8px;
  height: 8px;
  border: 2px solid ${textColor.colorShamrockApprox};
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;

  &.active {
    opacity: 1;
  }
`;

const ChatName = styled.span`
  top: 15px;
  right: 12px;
  position: relative;
`;

const ChannelHeaderPhoto = styled.img`
  border-radius: 50%;
  height: 48px;
  float: right;
  position: relative;
  right: 1.5rem;
  top: 1.5rem;

  svg {
    height: 48px;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  color: ${textColor.colorCelesteApprox};
  background: none;
  font-weight: bold;
  font-size: 1.4em;
  border: none;
  cursor: pointer;
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
      background: ${bgColor.colorPictonBlue} ${AiFillStar} no-repeat -2px -2px !important;
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

const dots = keyframes`
  0% {
    color: rgba(0, 0, 0, 0);
    text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
  }
  20% {
    color: rgba(0, 0, 0, 0);
    text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
  }
  40% {
    color: ${textColor.textWhite};
    text-shadow: 0.25em 0 0 rgba(0, 0, 0, 0), 0.5em 0 0 rgba(0, 0, 0, 0);
  }
  60% {
    text-shadow: 0.25em 0 0 ${textColor.textWhite}, 0.5em 0 0 rgba(0, 0, 0, 0);
  }
  80% {
    text-shadow: 0.25em 0 0 ${textColor.textWhite}, 0.5em 0 0 ${textColor.textWhite};
  }
  100% {
    text-shadow: 0.25em 0 0 ${textColor.textWhite}, 0.5em 0 0 ${textColor.textWhite};
  }
`;

const ChatFileUpload = styled.div`
  position: absolute;
  color: ${textColor.textWhite};
  background: ${bgColor.colorCuriousBlue};
  bottom: 0;
  left: 0;
  width: 84%;
  height: 1.5rem;
  padding: 1rem 1rem 1rem 2rem;

  span::after {
    content: " .";
    animation: ${dots} 1s steps(5, end) infinite;
  }
`;

const AttachmentIcon = styled.label`
  position: absolute;
  bottom: 15px;
  left: 15px;
  width: 25px;
  height: 25px;
  z-index: 9999;
  cursor: pointer;

  .chat__upload {
    display: none !important;
  }
`;

const ChatInput = styled.input`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 75%;
  height: 45px;
  padding: 0.5rem 1rem 0.5rem 4rem;
  background-repeat: no-repeat;
  background-position: 1rem 1rem;
  background-color: ${bgColor.colorAthensGray};
  font-size: 1em;
  color: ${textColor.colorClay};
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
`;

export default ChatBox;
