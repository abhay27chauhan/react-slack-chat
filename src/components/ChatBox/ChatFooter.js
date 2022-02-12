import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import Picker, { SKIN_TONE_MEDIUM_DARK } from "emoji-picker-react";
import { GrAttachment } from "react-icons/gr";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import emojiIcon from "../../assets/emojiIcon.svg";
import { debugLog } from "../../lib/utils";
import { postFile } from "../../lib/chatFunctions";
import { saveChannelMap } from "../../lib/cachedChannelMap";

function ChatFooter({
  bot,
  botName,
  apiToken,
  activeChannelRef,
  singleUserMode,
  TS_MAP,
  refreshTime,
}) {
  const [postMyMessage, setPostMyMessage] = useState("");
  const [inputDisabed, setInputDisabled] = useState(false);
  const [fileUploadLoader, setFileUploadLoader] = useState(false);
  const [postMyFile, setPostMyFile] = useState("");
  const [emojiPicker, showEmojiPicker] = useState(false);
  const fileUploadTitle = `Posted by ${botName}`;

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
    <InputBox>
      {emojiPicker && (
        <EmojiPickerBox>
          <Picker
            onEmojiClick={(e, emojiObject) =>
              setPostMyMessage(postMyMessage + emojiObject.emoji)
            }
            disableAutoFocus={true}
            skinTone={SKIN_TONE_MEDIUM_DARK}
            groupNames={{ smileys_people: "PEOPLE" }}
            native
          />
        </EmojiPickerBox>
      )}
      {fileUploadLoader && (
        <ChatFileUpload>
          <span>Uploading</span>
        </ChatFileUpload>
      )}
      {!fileUploadLoader && (
        <div>
          <Attachment>
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
          </Attachment>
          <ChatInput
            type="text"
            id="chat__input__text"
            value={postMyMessage}
            placeholder="Enter your message..."
            disabled={inputDisabed}
            onKeyPress={(e) => e.key === "Enter" && postNewMessage()}
            onChange={(e) => setPostMyMessage(e.target.value)}
            onClick={() => {
              if (emojiPicker) showEmojiPicker(false);
            }}
          />
          <EmojiIcon className="icon-on-hover">
            <img
              src={emojiIcon}
              alt="Emoji Icon"
              onClick={() => showEmojiPicker(!emojiPicker)}
            />
          </EmojiIcon>
        </div>
      )}
    </InputBox>
  );
}

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

const InputBox = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
`;

const Attachment = styled.div`
  position: absolute;
  bottom: 15px;
  left: 15px;
  z-index: 9999;
`;

const AttachmentIcon = styled.label`
  width: 25px;
  height: 25px;
  cursor: pointer;

  .chat__upload {
    display: none !important;
  }
`;

const ChatInput = styled.input`
  width: 100%;
  height: 62px;
  padding: 0.5rem 2.5rem 0.5rem 2.5rem;
  font-size: 1em;
  color: ${textColor.colorClay};
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  box-sizing: border-box;
`;

const EmojiIcon = styled.div`
  position: absolute;
  bottom: 15px;
  right: 15px;
  height: 28px;
  width: 28px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
`;

const EmojiPickerBox = styled.div`
  position: absolute;
  bottom: 100px;
  right: 0px;
  z-index: 10000;
  min-width: 150px;
`;

export default ChatFooter;
