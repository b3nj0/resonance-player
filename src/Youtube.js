import _ from 'lodash';
import querystring from 'querystring';
import youtubeSearch from 'youtube-search';

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
      this._augmentVideos(query, newVideos);
      query.callback(query, query.videos);
    });
  }
  _augmentVideos = (query, videos) => {
    const opts = {
      key: YOUTUBE_API_KEY,
      id: videos.map(v => v.id).join(','),
      part: 'contentDetails,statistics'
    }
    const url = 'https://www.googleapis.com/youtube/v3/videos?' + querystring.stringify(opts);
    fetch(url).then(results => results.json()).then(json => {
      const metadata = json.items;
      let i = 0, j = 0;
      while (i < query.videos.length && j < metadata.length) {
        const video = query.videos[i++];
        if (video.id === metadata[j].id) {
          video.meta = metadata[j];
          j++;
        }
      }
      query.callback(query, query.videos);
    });
  }
}

export default Youtube;
