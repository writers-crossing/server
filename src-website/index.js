import express from 'express'
import { engine } from 'express-handlebars'

import config from '../data/config.json' assert { type: "json" }

const app = express()
const port = config.expressPort

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home')
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})