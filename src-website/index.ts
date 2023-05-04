import logger from './app/logger'

import express from 'express'
import { engine } from 'express-handlebars'

import config from '../data/config.json'
import { getUserAvatarPng } from './endpoints'

const app = express()
const port = config.expressPort

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/users/:id/avatar.png', getUserAvatarPng);

app.listen(port, () => {
  logger.info(`App listening on port ${port}`)
})