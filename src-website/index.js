import logger from './app/logger.js'

import express from 'express'
import { engine } from 'express-handlebars'

import AdminJS from 'adminjs'
import AdminJSExpress from '@adminjs/express'
import * as AdminJSSequelize from '@adminjs/sequelize'

import { User, Sprint, WcEntry } from './app/database.js'

import config from '../data/config.json' assert { type: "json" }

const app = express()
const port = config.expressPort

/*
const admin = new AdminJS({
  options: {
    rootPath: '/admin'
  },
  resources: [ User, Sprint, WcEntry ]
})

AdminJS.registerAdapter({
  Resource: AdminJSSequelize.Resource,
  Database: AdminJSSequelize.Database,
})

const adminRouter = AdminJSExpress.buildRouter(admin)
app.use(admin.options.rootPath, adminRouter)
*/

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  res.render('home')
})

app.listen(port, () => {
  logger.info(`App listening on port ${port}`)
})