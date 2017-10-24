import React, { Component } from 'react';
import ReactPlayer from 'react-player';
import { Form, Input } from 'semantic-ui-react';
import youtubeSearch from 'youtube-search';

import logo from './logo.svg';
import './App.css';

const YOUTUBE_API_KEY = 'AIzaSyCtLy8fjvsD_KE8h-GMMoc0aHIBqJnmkpo';

class SearchBar extends Component {
  search = (e) => {
    const term = e.target.term.value;
    
    const opts = {
      key: YOUTUBE_API_KEY
    };
    youtubeSearch(term, opts, (err, videos, pageInfo) => {
      this.setState({
        videos: videos,
        pageInfo: pageInfo
      });
      console.log(videos);
      console.log(pageInfo);
    });
  }
  render() {
    return (
      <Form onSubmit={this.search}>
        <Input placeholder='Search...' name='term' action={{icon:'search'}} />
      </Form>
    );
  }
}

class VideoPlayer extends Component {
  render() {
    return (
      <ReactPlayer url={this.props.url} controls/>
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
        </p>
        <SearchBar/>
        <VideoPlayer url="https://www.youtube.com/watch?v=MBVbVNgRmiA"/>
      </div>
    );
  }
}

export default App;
