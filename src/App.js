import React from "react";
import ReactSlackChat from "./components/ReactSlackChat/ReactSlackChat";

function App() {
  return (
    <ReactSlackChat
      botName="batman"
      botId="U03363WRNUQ"
      apiToken="xoxb-3086413923460-3108132872976-3o7kJeYYuRx1S8DcPmHlqrXr"
      channels={[
        {
          name: "random",
          icon: "https://cdn.shopify.com/s/files/1/0598/2076/9478/files/quinn_lVK0kQl5DBgM6HVu0XKF8_story.jpg?v=1644219854"
        },
      ]}
      userImage="https://robohash.org/183.87.13.138"
      singleUserMode={true}
      helpText="Optional Help Text"
      defaultChannel="random"
    />
  );
}

export default App;
