import React, { useState, useRef } from "react";
import styled, { keyframes } from "styled-components";
import Picker, { SKIN_TONE_MEDIUM_DARK } from "emoji-picker-react";
import { GrAttachment } from "react-icons/gr";
import { ImCross } from "react-icons/im";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import emojiIcon from "../../assets/emojiIcon.svg";
import { debugLog } from "../../lib/utils";
import { postFile } from "../../lib/chatFunctions";
import { saveChannelMap } from "../../lib/cachedChannelMap";
import { postMessage } from "../../lib/slack-utils";

function ChatFooter({
  bot,
  botName,
  apiToken,
  activeChannelRef,
  singleUserMode,
  TS_MAP,
  refreshTime,
  defaultChannel,
}) {
  const [postMyMessage, setPostMyMessage] = useState("");
  const [inputDisabed, setInputDisabled] = useState(false);
  const [fileUploadLoader, setFileUploadLoader] = useState(false);
  const [emojiPicker, showEmojiPicker] = useState(false);
  const [files, setFiles] = useState([]);
  const fileUploadTitle = `Posted by ${botName}`;
  const fileObject = useRef([]);
  const fileArray = useRef([]);

  function handleFileChange(e) {
    e.preventDefault();
    debugLog("Going to upload", e.target.value, e.target);
    fileObject.current.push(...Array.from(e?.target?.files));
    for (let i = fileArray.current.length; i < fileObject.current.length; i++) {
      fileArray.current.push(URL.createObjectURL(fileObject.current[i]));
    }
    setFiles([...fileArray.current]);
  }

  function deleteOnClick(index) {
    fileObject.current = fileObject.current.filter((obj, i) => i !== index);
    fileArray.current = fileArray.current.filter((obj, i) => i !== index);
    setFiles(fileArray.current);
  }

  function postMyFile() {
    setFileUploadLoader(true);
    setFiles([]);
    Promise.all(
      fileObject.current[0].map((fileObject) =>
        postFile({
          file: fileObject,
          title: fileUploadTitle,
          apiToken: apiToken,
          channel: activeChannelRef.current.id,
          thread_ts: TS_MAP.current[defaultChannel],
        })
      )
    )
      .then(() => {
        setFileUploadLoader(false);
        fileObject.current = [];
        fileArray.current = [];
      })
      .catch((err) => {
        debugLog("Could not post file", err);
        fileObject.current = [];
        fileArray.current = [];
      });
  }

  function postNewMessage() {
    if (files && files.length > 0) {
      postMyFile();
      return;
    }
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
      {files && files.length > 0 && (
        <PreviewBox>
          {files.map((url, i) => (
            <div key={i}>
              <img src={url} alt="preview" />
              <StyledCross onClick={() => deleteOnClick(i)} />
            </div>
          ))}
        </PreviewBox>
      )}
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
        <>
          <Attachment>
            <AttachmentIcon htmlFor="chat__upload">
              <GrAttachment />
              <input
                type="file"
                accept="image/*"
                multiple
                id="chat__upload"
                className="chat__upload"
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
        </>
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
  height: 49px;
  width: 100%;
  border-radius: 30px;
  display: grid;
  place-items: center;

  span::after {
    content: " .";
    animation: ${dots} 1s steps(5, end) infinite;
  }
`;

const InputBox = styled.div`
  position: absolute;
  bottom: 8px;
  background-color: #f4f4f4;
  border-radius: 30px;
  padding: 11px;
  box-sizing: border-box;
  width: 90%;
  left: 50%;
  transform: translateX(-50%);
  height: 49px;
  display: flex;
  align-items: center;
`;

const StyledCross = styled(ImCross)`
  position: absolute;
  top: -5px;
  left: 76%;
  height: 10px;
  cursor: pointer;
`;

const PreviewBox = styled.div`
  position: absolute;
  top: -49px;
  left: -17px;
  width: 340px;
  height: 49px;
  box-sizing: border-box;
  z-index: 10000;
  background-color: white;
  padding: 5px 10px;
  display: flex;
  gap: 10px;
  overflow-x: auto;

  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  div {
    position: relative;
    height: 100%;
    border: 2px solid gray;
    width: 30px;
  }

  img {
    height: 100%;
    width: 100%;
  }
`;

const Attachment = styled.div`
  position: absolute;
  bottom: 11px;
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
  padding: 0.5rem 2.5rem 0.5rem 2.5rem;
  font-size: 1em;
  color: ${textColor.colorClay};
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  box-sizing: border-box;
  border: none;
  background-color: #f4f4f4;
  outline: none;
`;

const EmojiIcon = styled.div`
  position: absolute;
  bottom: 9px;
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
