import React, { Component } from 'react';
import ReactPlayer from 'react-player';
import { Card, Form, Image, Input } from 'semantic-ui-react';
import youtubeSearch from 'youtube-search';

import logo from './logo.svg';
import './App.css';

// youtube api

const YOUTUBE_API_KEY = 'AIzaSyCtLy8fjvsD_KE8h-GMMoc0aHIBqJnmkpo';

class Youtube {
  term = '';
  videos = [];
  pageInfo = {};
  
  search = (term, callback) => {
    const query = {
      term: term,
      videos: [],
      pageInfo: {},
      callback: callback,
      nextPage: () => {
        const opts = {
          key: YOUTUBE_API_KEY,
          pageToken: query.pageInfo.nextPageToken
        };
        this._fetchPage(query, opts);
      }
    };
    const opts = {
      key: YOUTUBE_API_KEY
    };
    this._fetchPage(query, opts);
  }
  _fetchPage = (query, opts) => {
    youtubeSearch(query.term, opts, (err, newVideos, pageInfo) => {
      query.videos = query.videos.concat(newVideos);
      query.pageInfo = pageInfo;
      query.callback(query, query.videos);
    });
  }
}

// gui

class SearchBar extends Component {
  render() {
    return (
      <Form onSubmit={e => this.props.onSubmit(e.target.term.value)}>
        <Input placeholder='Search...' name='term' action={{icon:'search'}} />
      </Form>
    );
  }
}

class VideoCard extends Component {
  render() {
    const v = this.props.video;
    return (
      <Card>
        <Image src={v.thumbnails.default.url} />
        <Card.Content>
          <Card.Header>{v.title}</Card.Header>
        </Card.Content>
      </Card>
    );
  }
}

class VideoGrid extends Component {
  render() {
    const cards = this.props.videos.map((v) => { 
      return <VideoCard key={v.id} video={v} />
    });
    return (
      <Card.Group>{cards}</Card.Group>
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
  state = {
    videos: []
  }
  youtube = new Youtube();
  onSearch = (term) => {
    console.log('Searching for ' + term);
    this.youtube.search(term, (q, videos) => {  
      console.log(q);
      this.setState({
        query: q,
        videos: videos
      });
    });
  }
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
        <SearchBar onSubmit={this.onSearch}/>
        <VideoGrid videos={this.state.videos}/>
        <VideoPlayer url="https://www.youtube.com/watch?v=MBVbVNgRmiA"/>
      </div>
    );
  }
}

export default App;
