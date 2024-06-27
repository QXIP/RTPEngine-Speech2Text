var config = {
  rec_path: process.env.REC_PATH || __dirname + '/recording',
  meta_path: process.env.META_PATH || __dirname + '/meta',
  hep_config: {
    debug: process.env.DEBUG || false,
    HEP_TRANS: process.env.HEP_TRANS || 'udp4',
    HEP_SERVER: process.env.HEP_SERVER || '127.0.0.1',
    HEP_PORT: process.env.HEP_PORT || 9060,
  },
  bing_options: {
    language: 'en-US',
    subscriptionKey: 'YOUR-KEY-HERE' // https://azure.microsoft.com/en-us/services/cognitive-services
  }
}

module.exports = config;
