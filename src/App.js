import React, { Component } from 'react';
import youtubeSearch from 'youtube-search';

import logo from './logo.svg';
import './App.css';

const YOUTUBE_API_KEY = 'AIzaSyCtLy8fjvsD_KE8h-GMMoc0aHIBqJnmkpo';

class SearchBar extends Component {
  search = () => {
    const opts = {
      key: YOUTUBE_API_KEY
    };
    youtubeSearch('balloon', opts, (err, videos, pageInfo) => {
      console.log(videos);
      console.log(pageInfo);
    });
  }
  render() {
    return (
      <button onClick={this.search}>Search</button>
    );
  }
}

class App extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
          <SearchBar/>
        </p>
      </div>
    );
  }
}

export default App;
