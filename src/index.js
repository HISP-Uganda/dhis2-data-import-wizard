import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import Loading from './components/Loading';
import * as serviceWorker from './serviceWorker';
import IntegrationStore from './stores/IntegrationStore'
import { init } from 'd2';
import { Provider } from "mobx-react";

const config = {};
if (process.env.NODE_ENV === 'development') {
  config.baseUrl = `http://localhost:8080/api`;
  // config.baseUrl = 'https://play.dhis2.org/2.30/api'
  // config.baseUrl = 'https://ds.dev.hispuganda.org/api'
  // config.baseUrl = 'https://ds.dev.hispuganda.org/api';
  // config.baseUrl = 'https://programs.psiug.org/psi/api'
  // config.baseUrl = 'https://htm-repo.dev.hispuganda.org/api'
  // config.baseUrl = 'https://ugandaeidsr.org/api'
  config.headers = { Authorization: 'Basic YWRtaW46ZGlzdHJpY3Q=' }; // admin
  // config.headers = { Authorization: 'Basic SGlzcDpBcGlAMjAxOSE=' };// dev pace
  // config.headers = { Authorization: 'Basic aW1wb3J0ZXI6SW1wb3J0ZXIzMjEk' };// Stephen
  // config.headers = { Authorization: 'Basic Q2hhcmxlcy5PbHVwb3Q6RGhpc0AyMDIw' };// eidsr
  // config.baseUrl = `http://dhis2-staging.kuunika.org:8087/api`;
  // config.headers = { Authorization: 'Basic bWJvbmdlbmljaGl6b25kYTpBYmlreWwyMkA=' };
  // config.headers = { Authorization: 'Basic c3RlcGhlbjpIaXNwQDIwMTk=' };
} else {
  let baseUrl;
  let urlArray = window.location.pathname.split('/');
  let apiIndex = urlArray.indexOf('api');
  if (apiIndex > 1) {
    baseUrl = '/' + urlArray[apiIndex - 1] + '/';
  } else {
    baseUrl = '/';
  }
  baseUrl = window.location.protocol + '//' + window.location.host + baseUrl;
  config.baseUrl = baseUrl + 'api'
}

ReactDOM.render(<Loading />, document.getElementById('root'));
init(config).then(d2 => {
  ReactDOM.render(<Provider IntegrationStore={IntegrationStore}><App d2={d2} /></Provider>, document.getElementById('root'));
  serviceWorker.unregister();
}).catch(e => ReactDOM.render(<div style={{
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  width: '100vw',
  height: '100vh',
  fontSize: 28
}}>
  {JSON.stringify(e)}
</div>, document.getElementById('root'))
);



