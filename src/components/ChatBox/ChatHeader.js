import React from "react";
import styled from "styled-components";

import { fontFamily, textColor } from "../../lib/constants";
import defaultChannelIcon from "../../assets/team.svg";

function ChatHeader({
  activeChannelRef,
  goToChannelView,
  closeChatButton,
  closeChatBox,
}) {
  return (
    <Header>
      <HeaderTop>
        <ChatBack onClick={goToChannelView} />
        {closeChatButton && <CloseButton onClick={closeChatBox}>×</CloseButton>}
      </HeaderTop>
      <HeaderBottom>
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
      </HeaderBottom>
    </Header>
  );
}

const Header = styled.div`
  position: absolute;
  top: 0px;
  z-index: 9999;
  left: 0rem;
  width: 100%;
  height: 7rem;
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

  & > * {
    box-sizing: border-box;
  }
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44%;
  padding: 12px 10px 0px 30px;
`;

const ChatBack = styled.span`
  &::before {
    content: "";
    display: block;
    cursor: pointer;
    width: 1rem;
    height: 1rem;
    border: 3px solid #f6f3f3;
    border-right: none;
    border-bottom: none;
    transform: rotate(-45deg);
    transition: transform 0.3s;
  }

  &:hover::before {
    transform: translateX(-0.3rem) rotate(-45deg);
  }
`;

const HeaderBottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56%;
  padding: 0px 20px 0px 30px;
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
  height: 38px;
  width: 38px;
  border: 3px solid #70e1f5;
  border-radius: 50%;
`

const ChannelHeaderPhoto = styled.img`
  border-radius: 50%;
  height: 38px;

  svg {
    height: 38px;
  }
`;

const CloseButton = styled.button`
  color: #f6f3f3;
  background: none;
  font-size: 2rem;
  border: none;
  cursor: pointer;
`;

export default ChatHeader;
