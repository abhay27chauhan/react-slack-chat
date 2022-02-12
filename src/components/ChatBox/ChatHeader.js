import React from "react";
import styled from "styled-components";

import { bgColor, fontFamily, textColor } from "../../lib/constants";
import defaultChannelIcon from "../../assets/team.svg";

function ChatHeader({
  activeChannelRef,
  goToChannelView,
  closeChatButton,
  closeChatBox,
}) {
  return (
    <Header>
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
    </Header>
  );
}

const Header = styled.div`
  position: absolute;
  top: 0px;
  z-index: 9999;
  left: 0rem;
  width: 100%;
  height: 6rem;
  background: ${bgColor.themeColor};
  border-radius: 5px 5px 0px 0px;
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

export default ChatHeader;
