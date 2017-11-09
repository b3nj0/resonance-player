import React, { Component } from 'react';

import Humanize from 'humanize-plus';
import moment from 'moment';
import 'moment-duration-format';
import { Link } from 'react-router-dom';
import ReactPlayer from 'react-player';
import { Button, Card, Container, Form, Icon, Image, Input, Menu, Popup, Table, Transition, Visibility } from 'semantic-ui-react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Sortable from 'sortablejs';
import uuid from 'uuid-random';

import fire from './fire';
import logo from './logo.svg';
import Youtube from './Youtube';
import './App.css';


// playlist

class Playlist {
  currentIndex = 0; 
  videos = []; 

  connect(user) {
    this.ref = fire.database().ref(`users/${user.uid}/playlist/default`);
    this.ref.once('value', (snap) => {
      this.videos = snap.val() != null ? snap.val() : []; 
    });
  }
  observe(callback) {
    this.ref.on('value', (snap) => {
      this.videos = snap.val() != null ? snap.val() : [];
      callback(this.videos);
    });
  }
  unobserve() {
    this.ref.off('value');
  }

  // mutators
  clear() {
    this.ref.remove();
  }
  add(video, offset) {
    offset = offset || this.videos.length - this.currentIndex;
    let pos = this.bound(this.currentIndex + offset, false);
    this.videos.splice(pos, 0, video);
    this.ref.set(this.videos);
  }
  move(from, to) {
    this.trackCurrentVideo(() => {
      const videos = this.videos;
      videos.splice(to, 0, videos.splice(from, 1)[0]);
      this.ref.set(videos);
    });
  }
  remove(index) {
    this.videos.splice(index, 1);
    this.ref.set(this.videos.length === 0 ? null : this.videos);
  }
  shuffle() {
    this.trackCurrentVideo(() => {
      const videos = this.videos;
      if (videos.length === 0) {
        return;
      }
      for (var i = videos.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = videos[i];
        videos[i] = videos[j];
        videos[j] = temp;
      }
      this.ref.set(this.videos);
    });
  }
  next(offset=1) {
    this.currentIndex = this.bound(this.currentIndex + offset);
    return this.videos[this.currentIndex];
  }
  play(video) {
    this.currentIndex = this.videos.findIndex(v => v.uid === video.uid);
    return this.videos[this.currentIndex];
  }

  // util
  bound(index, wrap=true) {
    const newIndex = wrap ? (index % this.videos.length) : Math.min(Math.max(0, index), this.videos.length);
    return isNaN(newIndex) ? 0 : newIndex;
  }
  trackCurrentVideo(callback) {
    const current = this.videos[this.currentIndex].uid;
    callback();
    this.currentIndex = this.videos.findIndex(v => v.uid === current);
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

class VideoDuration extends Component {
  render() {
    const duration = moment.duration(this.props.video.meta.contentDetails.duration);
    return duration.format('h:mm:ss');
  }
}

class VideoMeta extends Component {
  render() {
    const v = this.props.video;
    if (!v.meta) {
      return null;
    }
    return (
      <Card.Meta><Icon name='eye' />{Humanize.compactInteger(v.meta.statistics.viewCount)}<Icon name='clock' /><VideoDuration video={v} /></Card.Meta>
    )
  }
}

class VideoCard extends Component {
  state = { show: false }
  onAddToPlaylist = (video) => {
    this.props.onAddToPlaylist(video);
  }
  onInfo = (video) => {
  }
  onPlay = (video) => {
    this.props.onAddToPlaylist(video);
    this.props.onPlay(video, true);
  }
  showButtons = () => {
    this.setState({show: true});
  }
  hideButtons = () => {
    this.setState({show: false});
  }
  render() {
    const v = this.props.video;
    const thumb = v.thumbnails.medium;
    return (
      <Card>
        <div onMouseOver={this.showButtons} onMouseOut={this.hideButtons}>
          <Image src={thumb.url} height={thumb.height} width={thumb.width} />
          <Transition animation='fade' duration={50} visible={this.state.show}>
            <div className='VideoCard-buttons'>
              <Icon link name='play' size='large' title='Play now' onClick={() => this.onPlay(v)}/>
              <Icon link name='plus' size='large' title='Add to queue'  onClick={() => this.onAddToPlaylist(v)} />
              <Icon link name='info' size='large' title='Info'  onClick={() => this.onInfo(v)} />
            </div>
          </Transition>
        </div>
        <Card.Content>
          <Card.Description className='truncate' title={v.title}><strong>{v.title}</strong></Card.Description>
          <VideoMeta video={v} />
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
    playlist: []
  }
  componentDidMount() {
    this.props.playlist.observe(playlist => {
      this.setState({playlist: playlist});
    });
    this.sortable = new Sortable(document.getElementById('playlist-tbody'), {
      draggable: '.draggable',
      onEnd: this.onMoveVideo
    });
  }
  componentWillUnmount() {
    this.props.playlist.unobserve();
  }
  onRemoveVideo = (index) => {
    this.props.playlist.remove(index);
  }
  onMoveVideo = (e) => {
    this.props.playlist.move(e.oldIndex, e.newIndex);
    this.forceUpdate();
  }
  render() {
    const current = this.props.playlist.next(0);
    
    const rows = this.state.playlist.map((video, i) => {
      const thumb = video.thumbnails.medium;
      return (
        <Table.Row key={video.id + '_' + i} active={video === current} className='draggable'>
          <Table.Cell collapsing>
            <a onClick={e => this.props.onPlay(video)}><Image src={thumb.url} height={thumb.height / 4} width={thumb.width / 4} /></a>
          </Table.Cell>
          <Table.Cell>{video.title}</Table.Cell>
          <Table.Cell collapsing><VideoDuration video={video} /></Table.Cell>
          <Table.Cell collapsing>
            <Icon name='trash outline' link size='large' onClick={e => this.onRemoveVideo(i)} />
          </Table.Cell>
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
              <Table.HeaderCell/>
            </Table.Row>
          </Table.Header>
          <Table.Body id='playlist-tbody'>
            {rows}
          </Table.Body>
        </Table>
      </div>
    );
  }
}
const STEPS = 100000;
class VideoPlayerBar extends Component {
  state = { position: 0 }
  onOpenInYoutube = () => { window.open(this.props.url) }
  onProgress = (p) => { this.setState({position: p.played * STEPS}) }
  onSeek = (pos) => {
    this.setState({position: pos}); 
    this.player.seekTo(pos / STEPS);
  }
  onShuffle = () => { this.props.playlist.shuffle() }
  render() {
    return (
      <Menu borderless fixed='bottom'>
        <Slider 
          style={{position:'absolute', left:0, top:-7, width:'100%'}} 
          min={0} 
          max={STEPS} 
          value={this.state.position}
          onChange={this.onSeek}
          />
        <Menu.Item position='left'>
          <ReactPlayer 
            ref={(player) => this.player = player}
            height={40}   
            width={60} 
            url={this.props.url} 
            playing={this.props.playing}
            progressFrequency={50} 
            onEnded={e => this.props.onPlay(this.props.playlist.next(1), this.props.playing)}
            onError={e => this.props.onPlay(this.props.playlist.next(1), this.props.playing)}
            onProgress={this.onProgress}
            />
        </Menu.Item>
        <Menu.Item>
          <Button.Group>
            <Button title='Repeat' icon='repeat' />
            <Button title='Previous' icon='step backward' onClick={e => this.props.onPlay(this.props.playlist.next(-1), this.props.playing)}/>
            <Button title='Play' icon={this.props.playing ? 'pause' : 'play'} onClick={e => this.props.onPlay(this.props.playlist.next(0), !this.props.playing)}/>
            <Button title='Next' icon='step forward' onClick={e => this.props.onPlay(this.props.playlist.next(1), this.props.playing)}/>
            <Button title='Shuffle' icon='random' onClick={this.onShuffle} />
          </Button.Group>
        </Menu.Item>
        <Menu.Item position='right'>
          <Button.Group>
            <Button title='Adjust Volume' icon='volume up' />
            <Button title='Open in YouTube' icon='youtube' onClick={this.onOpenInYoutube} />
            <Popup
              on='click'
              position='top right'
              size='tiny'
              flowing
              trigger={
                <Button title='Show Playlist' onClick={this.onShowPlaylist}>
                  <Icon.Group>
                    <Icon name='unordered list' />
                    <Icon corner name='music' />
                  </Icon.Group>
                </Button>
              }
              content={<PlaylistTable playlist={this.props.playlist} onPlay={v => this.props.onPlay(this.props.playlist.play(v), true)}/>}
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
  onPlay = (video, playing=!this.state.playing) => {
    if (!video) {
      return;
    }
    this.setState({
      playing: playing,
      url: video.link
    });
  }
  onAddToPlaylist = (video) => {
    const data = {
      uid: uuid(),
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
      },
      meta: {
        statistics: { duration: video.meta.statistics },
        contentDetails: { duration: video.meta.contentDetails.duration }
      }
    };
    this.playlist.add(data);
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
          <VideoPlayerBar url={this.state.url} playing={this.state.playing} playlist={this.playlist} onPlay={(video, playing) => this.onPlay(video, playing)}/>
        </div>
      </div>
    );
  }
}

export default App;
