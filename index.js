require('dotenv').config()
const express = require('express')
const cors = require('cors')
const app = express()
const bodyParser = require('body-parser')
const mongodb = require('mongodb')
const mongoose = require('mongoose')
const dns = require('dns')
const shortUid = require('short-unique-id')

const port = process.env.PORT || 3000

const uid = new shortUid({length: 5})

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
const shortUrl = mongoose.model('ShortUrl', new mongoose.Schema({
  origin: String,
  destination: String
}))

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/public', express.static(`${process.cwd()}/public`))

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html')
})

app.get('/api/hello', (req, res) => {
  res.json({ greeting: 'hello API' })
})

app.post('/api/shorturl', (req, res) => {
  const url = urlReformat(req.body.url)

  dns.resolveAny(url, (err) => {
    if (err) res.json({error: 'Invalid URL'})
    else {
      const code = uid()
      const cooking = new shortUrl({
        origin: req.body.url,
        destination: code
      })

      cooking.save((err, data) => {
        if (err) return console.error(err)
        res.json({
          original_url: req.body.url,
          short_url: code
        })
      })

    }
  })
})

app.get('/api/shorturl/:url', (req, res) => {
  const url = req.params.url
  shortUrl.findOne({destination: url}, (err, data) => {
    if (err) return console.error(err)

    res.redirect(301, data.origin)
  })
})

const urlReformat = (url) => {
  const urlSplit = url.split("https://")
  if (urlSplit[1] == undefined) return urlSplit[0].split("/")[0]
  else return urlSplit[1].split("/")[0]
}

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
