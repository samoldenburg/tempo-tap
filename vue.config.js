module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
      ? '/tempo-tap/' // Replace <your-repository-name> with your actual repository name
      : '/'
  }