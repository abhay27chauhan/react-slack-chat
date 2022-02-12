import React from "react";
import classNames from "classnames";
import styled from "styled-components";

import defaultChannelIcon from "../../assets/team.svg";
import { fontFamily, textColor } from "../../lib/constants";

function Channels({channelActiveView, channels, goToChatView}) {
  return (
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
  );
}

const Contact = styled.div`
  position: relative;
  width: 95%;
  height: 50px;
  padding: 10px 0px 10px 16px;
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
    top: 50%;
    transform: translateY(-50%);
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

export default Channels;
