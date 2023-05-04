import logger from './app/logger'

import express, { NextFunction } from 'express'
import { Request, Response } from 'express'
import Handlebars from 'handlebars'
import { engine } from 'express-handlebars'
import { allowInsecurePrototypeAccess } from '@handlebars/allow-prototype-access'
import path from 'node:path'

import config from '../data/config.json'
import { getAllTimeLeaderboard, getEntityUserByAny, getMonthLeaderboard, getSprintLeaderboard } from './app/database'
import { formatWc, getMonthName } from './app/business'
import { Sprint } from './app/entities'

const app = express()
const port = config.expressPort

app.engine('handlebars', engine({
  handlebars: allowInsecurePrototypeAccess(Handlebars),
  helpers: {
    formatWc: (wc: any) => { return formatWc(parseInt(wc)) }
  }
}))
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.static('public'))

// Homepage
app.get('/', async (_, res) => {
  return res.render('home', {
    month: getMonthName(new Date()),
    monthlyLeaderboardUsers: await getMonthLeaderboard(),
    allTimeLeaderboardUsers: await getAllTimeLeaderboard()
  })
})

// Users
app.get('/users/:id', async (req, res, next) => {
  let user = await getEntityUserByAny(req.params.id)
  if (!user || user?.isHidden) { return next() }

  return res.render('user', { title: `${user.name}'s Profile`, user: user })
})

app.get('/users/:id/avatar.png', async (req, res, next) => {
  let user = await getEntityUserByAny(req.params.id)
  if (!user || user?.isHidden) { return next() }

  if (!user.discordAvatar) return res.sendFile(path.join(__dirname, '../assets/default-avatar.png'))
  else return res.sendFile(path.join(__dirname, `../data/avatars/${user.id}.png`))
})

// Sprints
app.get('/sprints/:id', async (req, res, next) => {
  let sprint = await Sprint.findOne({ where: { id: req.params.id } })
  if (!sprint) { return next() }

  let sprintLeaderboard = await getSprintLeaderboard(sprint.id)

  return res.render('sprint', { title: `Sprint ${sprint.name}`, sprint: sprint, sprintLeaderboard: sprintLeaderboard })
})

// Custom 404 Middleware
app.use((req, res) => {
  res.status(404)

  if (req.accepts('html')) return res.render('404')
  else if (req.accepts('json')) return res.json({ status: 404, title: 'Page Not Found' })
  else throw new Error('Unable to determine req.accepts.')
})

// Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err)

  res.status(500)

  if (req.accepts('html')) return res.render('500')
  else if (req.accepts('json')) return res.json({ status: 500, title: 'Internal Server Error' })
  else throw new Error('Unable to determine req.accepts.')
})

app.listen(port, () => {
  logger.info(`App listening on port ${port}`)
})