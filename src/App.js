import React, { Component } from 'react';
import ReactPlayer from 'react-player';
import { Button, Card, Container, Form, Grid, Image, Input, Menu, Visibility } from 'semantic-ui-react';
import youtubeSearch from 'youtube-search';
import _ from 'lodash';

import logo from './logo.svg';
import './App.css';

// youtube api

const YOUTUBE_API_KEY = 'AIzaSyCtLy8fjvsD_KE8h-GMMoc0aHIBqJnmkpo';

class Youtube {
  term = '';
  videos = [];
  pageInfo = {};
  
  baseOpts = {
    key: YOUTUBE_API_KEY,
    type: 'video'
  }
  _opts = (extraOpts) => {
    return Object.assign({}, this.baseOpts, extraOpts);
  }
  search = _.debounce((term, callback) => {
    const query = {
      term: term,
      videos: [],
      pageInfo: {},
      callback: callback,
      nextPage: _.debounce(() => {
        const extra = {
          pageToken: query.pageInfo.nextPageToken,
        };
        this._fetchPage(query, this._opts(extra));
      }, 250)
    };
    this._fetchPage(query, this._opts());
  }, 250);
  _fetchPage = (query, opts) => {
    youtubeSearch(query.term, opts, (err, newVideos, pageInfo) => {
      query.videos = query.videos.concat(newVideos);
      query.pageInfo = pageInfo;
      query.callback(query, query.videos);
    });
  }
}

// playlist api

class Playlist {
  videos = [];
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
    const thumb = v.thumbnails.medium;
    return (
      <Card>
        <Image src={thumb.url} height={thumb.height} width={thumb.width} />
        <Card.Content>
          <Card.Header>{v.title}</Card.Header>
        </Card.Content>
        <Card.Content extra>
          <Button icon='play' size='mini' />
          <Button icon='plus' size='mini' />
          <Button icon='youtube play' size='mini' />
          <Button icon='info' size='mini' />
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
      <Card.Group itemsPerRow={4} stackable>{cards}</Card.Group>
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
        videos: videos,
        inflight: false
      });
    });
  }
  nextSearchResultsPage = () => {
    if (this.state.query && !this.state.inflight) {
      this.setState({inflight: true});
      this.state.query.nextPage();
    }
  }
  render() {
    return (
      <div className="App">
        <div id='top-panel'>
          <Menu fixed='top' borderless>
            <Menu.Item><Image src={logo} height={40} width={60} alt="logo" /></Menu.Item>
            <Menu.Item><SearchBar onSubmit={this.onSearch}/></Menu.Item>
          </Menu>
        </div>
        <Container id='content'>
          <Visibility continuous onBottomVisible={this.nextSearchResultsPage}>
            <VideoGrid videos={this.state.videos}/>
          </Visibility>
        </Container>
        <div id='side-panel'>
          <VideoPlayer url="https://www.youtube.com/watch?v=MBVbVNgRmiA"/>
        </div>
        <div id='bottom-panel'>
        </div>
      </div>
    );
  }
}

export default App;
