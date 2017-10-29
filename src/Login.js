import React, { Component } from 'react';
import { Redirect } from 'react-router-dom';
import firebase from 'firebase';

import fireauth from './fireauth';

class Login extends Component {
  state = { authenticated: false };
  componentDidMount() {
    const uiConfig = {
      'callbacks': {
        'signInSuccess': (user) => {
          this.setState({ authenticated: true });
          return false;
        }
      },
      'signInOptions': [
        firebase.auth.GoogleAuthProvider.PROVIDER_ID,
        firebase.auth.EmailAuthProvider.PROVIDER_ID
      ]
    };
    fireauth.start('#firebaseui-auth', uiConfig);
  }
  componentWillUnmount() {
    fireauth.reset();
  }
  render() {
    if (this.state.authenticated) {
      return (<Redirect to='/player' />)
    }
    return (
      <div id="firebaseui-auth"></div>
    );
  }
}

export default Login;
