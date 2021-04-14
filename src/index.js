import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import Loading from "./components/Loading";
import * as serviceWorker from "./serviceWorker";
import IntegrationStore from "./stores/IntegrationStore";
import { init } from "d2";
import { Provider } from "mobx-react";

const config = {};
if (process.env.NODE_ENV === "development") {
  config.baseUrl = process.env.REACT_APP_ECBSS_URL;
  config.headers = {
    Authorization: `Basic ${process.env.REACT_APP_ECBSS_PASS}`,
  };
} else {
  let baseUrl;
  let urlArray = window.location.pathname.split("/");
  let apiIndex = urlArray.indexOf("api");
  if (apiIndex > 1) {
    baseUrl = "/" + urlArray[apiIndex - 1] + "/";
  } else {
    baseUrl = "/";
  }
  baseUrl = window.location.protocol + "//" + window.location.host + baseUrl;
  config.baseUrl = baseUrl + "api";
}

ReactDOM.render(<Loading />, document.getElementById("root"));
init(config)
  .then((d2) => {
    ReactDOM.render(
      <Provider IntegrationStore={IntegrationStore}>
        <App d2={d2} />
      </Provider>,
      document.getElementById("root")
    );
    serviceWorker.unregister();
  })
  .catch((e) =>
    ReactDOM.render(
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          width: "100vw",
          height: "100vh",
          fontSize: 28,
        }}
      >
        {JSON.stringify(e)}
      </div>,
      document.getElementById("root")
    )
  );
