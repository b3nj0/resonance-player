import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Link,
  Redirect
} from 'react-router-dom';
import ReactDOM from 'react-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import './index.css';
import 'semantic-ui-css/semantic.min.css';
import App from './App';
import Login from './Login';
import registerServiceWorker from './registerServiceWorker';

const customHistory = createBrowserHistory();

const Root = () => (
  <Router history={customHistory}>
      <div>
          <Route path="/login" component={Login}/>
          <Route path="/player" component={App}/>
          <Redirect from="/" to="/login"/>
      </div>
  </Router>
);

ReactDOM.render(<Root />, document.getElementById('root'));
registerServiceWorker();
