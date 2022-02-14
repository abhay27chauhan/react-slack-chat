import React, { useState, useRef, useEffect } from "react";
import SlackBot from "slack";
import classNames from "classnames";
import styled, { createGlobalStyle } from "styled-components";

import ChatBox from "../ChatBox/ChatBox";
import Channels from "./Channels";
import { getChannels, getMessages, getUsers } from "../../lib/slack-utils";
import { arraysIdentical, debugLog, errorLogger } from "../../lib/utils";
import { getCachedChannelMap } from "../../lib/cachedChannelMap";
import { getNewMessages } from "../../lib/chatFunctions";
import { bgColor, fontFamily, textColor } from "../../lib/constants";

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

  // Create Bot
  const bot = useRef(new SlackBot({ token: props.apiToken }));
  const activeChannelRef = useRef([]);
  const activeChannelInterval = useRef(null);
  const chatInitiatedTs = useRef();
  const TS_MAP = useRef(getCachedChannelMap({ channels: props.channels }));
  const refreshTime = 5000;

  function gotNewMessages(newMessages) {
    const newCount = newMessageNotification + newMessages.length;
    setNewMessageNotification(newCount);
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
    ])
      .then(([channelData, teamData]) => {
        debugLog("got channel and team data", channelData, teamData);
        const { channels, activeChannel } = channelData;
        const { onlineUsers } = teamData;

        activeChannelRef.current = activeChannel;
        activeChannel && setChatActiveView(true);
        return { channels, onlineUsers };
      })
      .catch((err) => {
        errorLogger("connectBot", err);
        throw err;
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
            if (messages.length !== 0) {
              const newMessages = getNewMessages(
                messages,
                messagesData.messages,
                props.botId
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
          return setFailed(true);
        });
    };

    // Call it once
    // getMessagesFromSlack();
  }

  function goToChannelView(e) {
    e.stopPropagation();
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
    e.stopPropagation();

    if (chatboxActive || chatActiveView) {
      activeChannelRef.current = channel;
      setChannelActiveView(false);
      setChatActiveView(true);

      if (activeChannelInterval.current) {
        clearInterval(activeChannelInterval.current);
        activeChannelInterval.current = null;
      }

      // Focus input box
      const inputTextBox = document.getElementById("chat__input__text");
      inputTextBox.focus();

      loadMessages(channel);
    }
  }

  function openChatBox(e) {
    if (!chatboxActive) {
      setChatboxActive(true);
      !chatActiveView && setChannelActiveView(true);
      setNewMessageNotification(0);
    }

    if (chatActiveView) {
      goToChatView(e, activeChannelRef.current);
    }
  }

  function closeChatBox(e) {
    e.stopPropagation();
    if (e.target.closest(".card-active")) return;

    if (chatboxActive) {
      setChatboxActive(false);
      setNewMessageNotification(0);
    }
  }

  useEffect(() => {
    if(messages.length < 0 || !activeChannelRef.current) return;

    activeChannelInterval.current = setInterval(
      () => loadMessages(activeChannelRef.current),
      refreshTime
    );

    return () => {
      activeChannelInterval.current && clearInterval(activeChannelInterval.current);
    }
  }, [messages]);

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

    chatboxActive && window.addEventListener("click", runOnClick);

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
          {newMessageNotification > 0 && !chatboxActive && (
            <UnreadNotificationsBadge>
              {newMessageNotification}
            </UnreadNotificationsBadge>
          )}
          <h2 className="transition">{props.helpText || "Help?"}</h2>
          <h2 className="subText">Click on a channel to interact.</h2>
        </Header>
        <Channels
          channelActiveView={channelActiveView}
          channels={channels}
          goToChatView={goToChatView}
        />
        <ChatBox
          activeChannelRef={activeChannelRef}
          goToChannelView={goToChannelView}
          messages={messages}
          closeChatBox={closeChatBox}
          closeChatButton={props.closeChatButton}
          bot={bot}
          singleUserMode={props.singleUserMode}
          TS_MAP={TS_MAP}
          apiToken={props.apiToken}
          botName={props.botName}
          refreshTime={refreshTime}
          userImage={props.userImage}
          botId={props.botId}
          onlineUsers={onlineUsers}
        />
      </Card>
    </>
  ) : (
    ""
  );
}

const GlobalStyles = createGlobalStyle`
  .card-active {
    cursor: default;
    height: 232.33px;
    width: 340px;
    z-index: 99999;

    h2 {
      color: ${textColor.textWhite};
      small {
        color: ${textColor.textWhite};
      }
    }

    &.chatActive {
      height: 500px;
      
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

  .icon-on-hover {
    &:hover {
        background: ${bgColor.bgHoverBlue};
        border-radius: 50%;
        cursor: pointer;
    }
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
  border-radius: 20px 20px 0px 0px;

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
  border-radius: 20px 20px 0px 0px;
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
