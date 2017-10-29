import React from 'react';
import { Router, Route, Redirect, Switch } from 'react-router-dom';
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
      <Switch>
          <Route exact path="/login" component={Login}/>
          <Route exact path="/player" component={App}/>
          <Redirect from="/" to="/login"/>
      </Switch>
  </Router>
);

ReactDOM.render(<Root />, document.getElementById('root'));
registerServiceWorker();
