import React from "react";
import styled from "styled-components";

import { fontFamily, textColor } from "../../lib/constants";
import defaultChannelIcon from "../../assets/team.svg";

function ChatHeader({ activeChannelRef }) {
  return (
    <Header>
      <ChatPerson>
        <PersonName>Abhay Chauhan</PersonName>
        <ChatName>{activeChannelRef.current?.name}</ChatName>
      </ChatPerson>
      <Image>
        <ChatOnline className="active" />
        <ChannelHeaderPhoto
          src={activeChannelRef.current?.icon || defaultChannelIcon}
          alt="active channel icon"
        />
      </Image>
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
  padding: 0px 20px 0px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #00c6ff; /* fallback for old browsers */
  background: -webkit-linear-gradient(
    to right,
    #0072ff,
    #00c6ff
  ); /* Chrome 10-25, Safari 5.1-6 */
  background: linear-gradient(
    to right,
    #0072ff,
    #00c6ff
  ); /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */
  border-radius: 20px 20px 0px 0px;
`;

const ChatPerson = styled.div`
  font-family: ${fontFamily.font_0}, ${fontFamily.font_1}, ${fontFamily.font_2},
    ${fontFamily.font_3};
  color: ${textColor.textWhite};
`;

const PersonName = styled.p`
  margin: 0;
  font-weight: bold;
  font-size: 1.5rem;
`;

const ChatOnline = styled.span`
  position: absolute;
  right: 0px;
  bottom: 0px;
  width: 10px;
  height: 10px;
  border: 1px solid;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s;
  background-color: ${textColor.colorShamrockApprox};

  &.active {
    opacity: 1;
  }
`;

const ChatName = styled.span`
  color: #d3d1d1;
`;

const Image = styled.div`
  position: relative;
  height: 48px;
  width: 48px;
  border: 3px solid #70e1f5;
  border-radius: 50%;
`;

const ChannelHeaderPhoto = styled.img`
  border-radius: 50%;
  height: 48px;

  svg {
    height: 48px;
  }
`;

export default ChatHeader;
