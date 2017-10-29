import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button, Card, Container, Form, Grid, Icon, Image, Input, Menu, Popup, Table, Visibility } from 'semantic-ui-react';
import youtubeSearch from 'youtube-search';
import _ from 'lodash';

import fire from './fire';
import logo from './logo.svg';
import './App.css';

// youtube api

const YOUTUBE_API_KEY = 'AIzaSyCtLy8fjvsD_KE8h-GMMoc0aHIBqJnmkpo';

class Youtube {
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

// playlist

class Playlist {
  connect(user) {
    this.ref = fire.database().ref(`users/${user.uid}/playlist/default`);
  }
  push(video) {
    this.ref.push(video);
  }
  observe(callback) {
    this.ref.on('value', (snap) => {
      callback(snap != null ? snap.val() : {});
    });
  }
}

// gui

class SearchInput extends Component {
  render() {
    return (
      <Form onSubmit={e => this.props.onSubmit(e.target.term.value)}>
        <Input placeholder='Search...' name='term' action={{icon:'search'}} />
      </Form>
    );
  }
}

class UserAvatar extends Component {
  render() {
    console.log(this.props.user);
    if (this.props.user) {
      return (
        <span><Image src={this.props.user.photoURL} height={40} width={40} alt='avatar' /></span>
      )
    } else {
      return <Link to='/login'>Sign in</Link>
    }
  }
}

class SearchBar extends Component {
  render() {
    return (
      <Menu fixed='top' borderless>
        <Menu.Item position='left'><Image src={logo} height={40} width={60} alt="logo" /></Menu.Item>
        <Menu.Item><SearchInput onSubmit={this.props.onSubmit} /></Menu.Item>
        <Menu.Item position='right'><UserAvatar user={this.props.user} /></Menu.Item>
      </Menu>
    );
  }
}

class VideoCard extends Component {
  onInfo = () => {
    console.log(this.props.video);
  }
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
          <Button title='Play now' icon='play' size='mini' onClick={() => this.props.onPlay(v)} />
          <Button title='Add to queue' icon='plus' size='mini' onClick={() => this.props.onAddToPlaylist(v)} />
          <Button title='Info' icon='info' size='mini' onClick={this.onInfo} />
        </Card.Content>
      </Card>
    );
  }
}

class VideoGrid extends Component {
  render() {
    const cards = this.props.videos.map((v) => { 
      return <VideoCard key={v.id} video={v} onPlay={this.props.onPlay} onAddToPlaylist={this.props.onAddToPlaylist} />
    });
    return (
      <Card.Group itemsPerRow={5} stackable>{cards}</Card.Group>
    );
  }
}

class PlaylistTable extends Component {
  state = { 
    playlist: {}
  }
  componentDidMount() {
    this.props.playlist.observe(playlist => {
      //console.log(playlist);
      this.setState({playlist: playlist});
    });
  }
  render() {
    const rows = Object.entries(this.state.playlist).map((entry, i) => {
      const video = entry[1];
      const thumb = video.thumbnails.medium;
      return (
        <Table.Row key={i}>
          <Table.Cell collapsing>
            <Image src={thumb.url} height={thumb.height / 4} width={thumb.width / 4} />
          </Table.Cell>
          <Table.Cell>{video.title}</Table.Cell>
          <Table.Cell collapsing></Table.Cell>
        </Table.Row>
      );
    });
  
    return (
      <div style={{width:'600px', height:'400px', overflowX: 'scroll'}}>
        <Table basic='very' compact>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell/>
              <Table.HeaderCell>Video</Table.HeaderCell>
              <Table.HeaderCell><Icon name='clock' /></Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows}
          </Table.Body>
        </Table>
      </div>
    );
  }
}

class VideoPlayerBar extends Component {
  onOpenInYoutube = () => { window.open(this.props.url) }
  render() {
    return (
      <Menu fixed='bottom' borderless>
        <Menu.Item position='left'>
          <ReactPlayer height={40} width={60} url={this.props.url} playing={this.props.playing} />
        </Menu.Item>
        <Menu.Item>
          <Button.Group>
            <Button icon='repeat' />
            <Button icon='step backward' />
            <Button icon={this.props.playing ? 'pause' : 'play'} onClick={this.props.onPlay}/>
            <Button icon='step forward' />
            <Button icon='random' />
          </Button.Group>
        </Menu.Item>
        <Menu.Item position='right'>
          <Button.Group>
            <Button icon='volume up' />
            <Button icon='youtube' onClick={this.onOpenInYoutube} />
            <Popup
              on='click'
              position='top right'
              size='tiny'
              flowing
              trigger={
                <Button onClick={this.onShowPlaylist}>
                  <Icon.Group>
                    <Icon name='unordered list' />
                    <Icon corner name='music' />
                  </Icon.Group>
                </Button>
              }
              content={<PlaylistTable playlist={this.props.playlist} />}
            />
          </Button.Group>
        </Menu.Item>
      </Menu>
    );
  }
}

class App extends Component {
  state = {
    authenticated: false,
    url: 'https://www.youtube.com/watch?v=38WDfmIOjg8',
    videos: []
  }
  youtube = new Youtube();
  playlist = new Playlist();

  componentWillMount() {
    this.removeAuthListener = fire.auth().onAuthStateChanged((user) => {
      this.setState({
        authenticated: true,
        user: user
      });
      this.playlist.connect(user);
    });
  }

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
  onPlay = (video) => {
    this.setState({
      playing: true,
      url: video.link
    });
  }
  onAddToPlaylist = (video) => {
    const data = {
      id: video.id,
      title: video.title,
      description: video.description,
      link: video.link,
      thumbnails: { 
        medium: { 
          url: video.thumbnails.medium.url,
          height: video.thumbnails.medium.height,
          width: video.thumbnails.medium.width
        } 
      }
    };
    this.playlist.push(data);
  }
  render() {
    return (
      <div className="App" style={{paddingTop:'80px', paddingBottom:'80px'}}>
        <div id='top-panel'>
          <Menu fixed='top' borderless>
            <Menu.Item><Image src={logo} height={40} width={60} alt="logo" /></Menu.Item>
            <Menu.Item><SearchBar onSubmit={this.onSearch} user={this.state.user} /></Menu.Item>
          </Menu>
        </div>
        <Container id='content'>
          <Visibility continuous onBottomVisible={this.nextSearchResultsPage}>
            <VideoGrid videos={this.state.videos} onPlay={this.onPlay} onAddToPlaylist={this.onAddToPlaylist} />
          </Visibility>
        </Container>
        <div id='bottom-panel'>
          <VideoPlayerBar url={this.state.url} playing={this.state.playing} playlist={this.playlist} onPlay={() => this.setState({playing: !this.state.playing})}/>
        </div>
      </div>
    );
  }
}

export default App;
