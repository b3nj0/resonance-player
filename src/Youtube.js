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
    const ids = videos.map(v => v.id);
    console.log(ids);
    const opts = {
      key: YOUTUBE_API_KEY,
      id: ids.join(','),
      part: 'contentDetails,statistics'
    }
    console.log(querystring.stringify(opts));
    fetch('https://www.googleapis.com/youtube/v3/videos?' + querystring.stringify(opts)).then(results => results.text()).then(text => console.log(text));
  }
}

export default Youtube;
