import React, { useState, useRef, useEffect } from "react";
import SlackBot from "slack";
import classNames from "classnames";
import styled, { createGlobalStyle, keyframes } from "styled-components";
import { AiFillStar } from "react-icons/ai";
import { GrAttachment } from "react-icons/gr";

import {
  getChannels,
  getMessages,
  getUsers,
  postMessage,
} from "../../lib/slack-utils";
import { arraysIdentical, debugLog } from "../../lib/utils";
import {
  getCachedChannelMap,
  saveChannelMap,
} from "../../lib/cachedChannelMap";
import {
  decodeHtml,
  getNewMessages,
  hasAttachment,
  isAdmin,
  isSystemMessage,
  postFile,
  wasIMentioned,
} from "../../lib/chatFunctions";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import defaultChannelIcon from "../../assets/team.svg";

export default function ReactSlackChat(props) {
  const [failed, setFailed] = useState(false);
  // List of Online users
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);

  const [chatboxActive, setChatboxActive] = useState(false);
  const [channelActiveView, setChannelActiveView] = useState(false);
  const [chatActiveView, setChatActiveView] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(0);
  const [postMyMessage, setPostMyMessage] = useState("");
  const [postMyFile, setPostMyFile] = useState("");
  const [fileUploadLoader, setFileUploadLoader] = useState(false);
  const [inputDisabed, setInputDisabled] = useState(false);

  // Create Bot
  const bot = useRef(new SlackBot({ token: props.apiToken }));
  const activeChannelRef = useRef([]);
  const activeChannelInterval = useRef(null);
  const chatInitiatedTs = useRef();
  const TS_MAP = useRef(getCachedChannelMap({ channels: props.channels }));
  const refreshTime = 5000;
  const fileUploadTitle = `Posted by ${props.botName}`;

  function gotNewMessages(newMessages) {
    const newCount = newMessageNotification + newMessages.length;
    setNewMessageNotification(newCount);
  }

  function handleFileChange(e) {
    debugLog("Going to upload", e.target.value, e.target);
    const fileToUpload = document.getElementById("chat__upload").files[0];
    setFileUploadLoader(true);
    setPostMyFile(e.target.value);
    postFile({
      file: fileToUpload,
      title: fileUploadTitle,
      apiToken: props.apiToken,
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
      singleUserMode: props.singleUserMode,
      ts: TS_MAP.current[
        activeChannelRef.current?.name || activeChannelRef.current?.id
      ],
      apiToken: props.apiToken,
      channel: activeChannelRef.current?.id,
      username: props.botName,
    })
      .then((data) => {
        // single user and no ts thread info stored
        setInputDisabled(false);
        if (
          props.singleUserMode &&
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
    const myMessage = message.user === props.botId;
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
                  src={props.userImage || defaultChannelIcon}
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
    const mentioned = wasIMentioned(message, props.botName);

    return (
      <ChatMsgRow
        className={classNames(myMessage ? "mine" : "notMine")}
        key={message.ts}
      >
        {myMessage && (
          // show customer image
          <UserContactPhoto src={props.userImage} alt="userIcon" />
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

  function connectBot() {
    return Promise.all([
      getChannels({
        apiToken: props.apiToken,
        bot: bot.current,
        channelFilter: props.channels,
        defaultChannel: props.defaultChannel,
      }),
      getUsers({
        apiToken: props.apiToken,
        bot: bot.current,
      }),
    ]).then(([channelData, teamData]) => {
      debugLog("got channel and team data", channelData, teamData);
      const { channels, activeChannel } = channelData;
      const { onlineUsers } = teamData;

      activeChannelRef.current = activeChannel;
      return { channels, onlineUsers };
    });
  }

  function loadMessages(channel) {
    if (!chatInitiatedTs.current) {
      chatInitiatedTs.current = Date.now() / 1000;
    }
    // define loadMessages function
    const getMessagesFromSlack = () => {
      getMessages({
        bot: bot.current,
        apiToken: props.apiToken,
        channelId: channel.id,
        singleUserMode: props.singleUserMode,
        ts: TS_MAP.current[channel.name || channel.id],
      })
        .then((messagesData) => {
          // loaded channel history
          debugLog("got data", messagesData);

          // Scroll down only if the stored messages and received messages are not the same
          // reverse() mutates the array
          if (!arraysIdentical(messages, messagesData.messages.reverse())) {
            // Got new messages
            // We dont wish to execute action hooks if user opens chat for the first time
            if (messages.length !== 0) {
              const newMessages = getNewMessages(
                messages,
                messagesData.messages,
                props.botName
              );
              gotNewMessages(newMessages);
            }
            // set the state with new messages
            const newMessages = messagesData.messages;

            if (props.defaultMessage) {
              // add timestamp so list item will have unique key
              newMessages.unshift({
                text: props.defaultMessage,
                ts: chatInitiatedTs.current,
              });
            }

            setMessages(newMessages);
          }
        })
        .catch((err) => {
          debugLog(
            `There was an error loading messages for ${channel.name}. ${err}`
          );
          return this.setState({
            failed: true,
          });
        });
    };

    // Call it once
    getMessagesFromSlack();
    // Set the function to be called at regular intervals
    // get the history of channel at regular intevals
    activeChannelInterval.current = setInterval(
      getMessagesFromSlack,
      refreshTime
    );
  }

  function goToChannelView(e) {
    e && e.stopPropagation();
    // Close Chat box only if not already open
    if (chatboxActive) {
      setChannelActiveView(true);
      setChatActiveView(false);
      setMessages([]);

      activeChannelRef.current = [];

      if (activeChannelInterval.current) {
        clearInterval(activeChannelInterval.current);
        activeChannelInterval.current = null;
      }
    }
  }

  function goToChatView(e, channel) {
    // stop propagation so we can prevent any other click events from firing
    e && e.stopPropagation();

    if (chatboxActive) {
      activeChannelRef.current = channel;
      setChannelActiveView(false);
      setChatActiveView(true);

      if (activeChannelInterval.current) {
        clearInterval(activeChannelInterval.current);
      }

      // Focus input box
      const inputTextBox = document.getElementById("chat__input__text");
      inputTextBox.focus();

      loadMessages(channel);
    }
  }

  function openChatBox(e) {
    e.stopPropagation();
    e.persist();

    // Open Chat box only if not already open
    if (!chatboxActive) {
      setChatboxActive(true);
      !chatActiveView && setChannelActiveView(true);
      setNewMessageNotification(0);
    }
  }

  function closeChatBox(e) {
    e.stopPropagation();

    if (chatboxActive) {
      setChatboxActive(false);
    }
  }

  useEffect(() => {
    const chatMessages = document.getElementById(
      "widget-reactSlakChatMessages"
    );
    chatMessages.scrollTop =
      chatMessages.scrollHeight < chatMessages.scrollTop + 600 ||
      messages.length === 0
        ? chatMessages.scrollHeight
        : chatMessages.scrollTop;
  }, [messages]);

  useEffect(() => {
    connectBot()
      .then((data) => {
        debugLog("CONNECTED!", "got data", data);
        setOnlineUsers(data.onlineUsers);
        setChannels(data.channels);
      })
      .catch((err) => {
        debugLog("could not intialize slack bot", err);
        setFailed(true);
      });
  }, []);

  useEffect(() => {
    function runOnClick(e) {
      chatboxActive && closeChatBox(e);
    }

    window.addEventListener("click", runOnClick);

    return () => {
      window.removeEventListener("click", runOnClick);
    };
  }, [chatboxActive]);

  return !failed ? (
    <>
      <GlobalStyles />
      <Card
        className={classNames(
          "transition",
          chatboxActive ? "card-active" : "",
          chatActiveView ? "chatActive" : ""
        )}
        onClick={openChatBox}
      >
        <Header className="helpHeader">
          {newMessageNotification > 0 && (
            <UnreadNotificationsBadge>
              {newMessageNotification}
            </UnreadNotificationsBadge>
          )}
          <h2 className="transition">{props.helpText || "Help?"}</h2>
          <h2 className="subText">Click on a channel to interact.</h2>
        </Header>
        <div className={classNames("card_circle", "transition")} />
        <div
          className={classNames(
            "channels",
            "transition",
            channelActiveView ? "channelActive" : ""
          )}
        >
          {channels.map((channel) => (
            <Contact key={channel.id} onClick={(e) => goToChatView(e, channel)}>
              <ContactPhoto
                src={channel.icon || defaultChannelIcon}
                alt="channel icon"
              />
              <span className="contact__name">{channel?.name}</span>
              <span className={classNames("contact__status", "online")} />
            </Contact>
          ))}
        </div>
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
            {props.closeChatButton && (
              <CloseButton onClick={closeChatBox}>×</CloseButton>
            )}
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
      </Card>
    </>
  ) : (
    ""
  );
}

const GlobalStyles = createGlobalStyle`
  .card-active {
    cursor: default;
    height: 500px;
    width: 340px;
    z-index: 99999;

    .card_circle {
      background-size: cover;
      border-radius: 0;
    }

    h2 {
      color: ${textColor.textWhite};
      small {
        color: ${textColor.textWhite};
      }
    }

    &.chatActive {
      .helpHeader {
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.5s linear;
      }
      .channels {
        visibility: hidden;
        opacity: 0;
        transition: visibility 0s, opacity 0.5s linear;
      }
      .chat {
        visibility: visible;
        opacity: 1;
        transition: visibility 0s, opacity 0.5s linear;
      }
    }

    .subText {
      visibility: visible;
      transition: visibility 0s, opacity 0.5s linear;
      opacity: 1;
    }

    p {
      margin-top: 300px;
    }

    .channelActive.channels {
      overflow-y: auto;
      visibility: visible;
      transition: visibility 0s, opacity 0.5s linear;
      opacity: 1;
      overflow-x: hidden;
    }

    &.channelActive .helpHeader {
      visibility: visible;
      opacity: 1;
      transition: visibility 0s, opacity 0.5s linear;
    }
  }

  .transition {
    transition: 0.8s cubic-bezier(0.3, 0, 0, 1.3);
  }

  .system__message {
    max-width: 100%;
    color: ${textColor.themeColor};
  }
`;

const Card = styled.div`
  background-color: ${bgColor.bgWhite};
  box-shadow: 0 0 10px 2px ${bgColor.bgBlack30};
  height: 60px;
  position: fixed;
  right: 40px;
  bottom: 0;
  width: 340px;
  cursor: pointer;

  .channels {
    visibility: hidden;
    opacity: 0;
    transition: visibility 0s, opacity 0.5s linear;
  }

  .subText {
    visibility: hidden;
    transition: visibility 0s, opacity 0.5s linear;
    opacity: 0;
  }

  h2 {
    color: ${textColor.textWhite};
    font-family: ${fontFamily.font_0}, ${fontFamily.font_3};
    font-size: 24px;
    font-weight: 200;
    margin-top: 0;
    text-align: center;
    width: 100%;
    z-index: 9999;
  }
`;

const Header = styled.div`
  background: ${bgColor.themeColor};
  position: relative;
  padding: 20px;
`;

const UnreadNotificationsBadge = styled.span`
  padding: 25px;
  background: white;
  border-radius: 500px;
  font-family: Raleway, sans-serif;
  display: inline-block;
  min-width: 10px;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  color: #5c5c5c;
  white-space: nowrap;
  vertical-align: middle;
  background-color: #fefefe;
  position: absolute;
  left: 300px;
  bottom: 135px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

  &:hover {
    box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  }
`;

const Contact = styled.div`
  position: relative;
  width: 95%;
  height: 50px;
  margin-top: 10px;
  padding-left: 1rem;
  display: flex;
  align-items: center;
  cursor: pointer;
  overflow: hidden;

  .contact__name {
    font-family: ${fontFamily.font_0}, ${fontFamily.font_1},
      ${fontFamily.font_2}, ${fontFamily.font_3};
  }

  .contact__status {
    position: absolute;
    top: 20px;
    right: 15px;
    width: 8px;
    height: 8px;
    border: 2px solid ${textColor.colorJadeApprox};
    border-radius: 50%;
    opacity: 0;
    transition: opacity 0.3s;

    &.online {
      opacity: 1;
    }
  }
`;

const ContactPhoto = styled.img`
  border-radius: 50%;
  margin-right: 1.5rem;
  height: 50px;
  width: 50px;
  float: right;

  svg {
    height: 42px;
  }
`;

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
