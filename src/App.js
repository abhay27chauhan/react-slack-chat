import React from "react";
import ReactSlackChat from "./components/ReactSlackChat/ReactSlackChat";

function App() {
  return (
    <ReactSlackChat
      botName="batman" // VisitorID, CorpID, Email, IP address etc.
      botId="U03363WRNUQ"
      apiToken="xoxb-3086413923460-3108132872976-3o7kJeYYuRx1S8DcPmHlqrXr"
      channels={[
        {
          name: "random",
        },
      ]}
      userImage="https://robohash.org/183.87.13.138"
      singleUserMode={true}
      helpText="Optional Help Text"
      themeColor="#856090"
    />
  );
}

export default App;
