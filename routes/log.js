let express = require('express')
let router = express.Router()

const Errors = require('../lib/errors')
let { Sequelize, Log, Thread, User } = require('../models')

router.post('/', async (req, res) => {
	try {
		let thread, user
		if(req.body.route === 'thread') {
			thread = await Thread.findById(req.body.resourceId)

			if(!thread) throw Errors.sequelizeValidation(Sequelize, {
				error: 'thread does not exist',
				value: req.body.resourceId
			})
		} else if(
			req.body.route === 'userPosts' ||
			req.body.route === 'userThreads'
		) {
			user = await User.findById(req.body.resourceId)

			if(!user) throw Errors.sequelizeValidation(Sequelize, {
				error: 'user does not exist',
				value: req.body.resourceId
			})
		} else if(
			(req.body.route === 'settingsGeneral' ||
			req.body.route === 'settingsAccount') &&
			!req.session.loggedIn
		) {
			throw Errors.requestNotAuthorized
		}

		let log = await Log.create({
			route: req.body.route
		})

		if(thread) await log.setThread(thread)
		if(user) await log.setUser(user)
		if(req.session.username) {
			let sessionUser = await User.findOne({
				where: { username: req.session.username }
			})
			await log.setSessionUser(sessionUser)
		}

		res.json(log.toJSON())

	} catch (e) {
		if(e.name in Errors) {
			res.status(401)
			res.json({
				errors: [e]
			})
		} else if(e instanceof Sequelize.ValidationError) {
			res.status(400)
			res.json(e)
		} else {
			console.log(e)

			res.status(500)
			res.json({
				errors: [Errors.unknown]
			})
		}
	}
})

router.all('*', (req, res, next) => {
	if(req.session.admin) {
		next()
	} else {
		res.status(401)
		res.json({
			errors: [Errors.requestNotAuthorized]
		})
	}
})

router.get('/top-threads', async (req, res) => {
	try {
		let logs = await Log.findAll({
			where: {
				createdAt: {
					$gt: new Date(Date.now() - 1000*60*60*24)
				},
				route: 'thread'
			},
			include: [Thread]
		})

		//Sum each log for a thread
		let pageViewsObj = logs.reduce((obj, log) => {
			if(!obj[log.Thread.id]) {
				obj[log.Thread.id] = { Thread: log.Thread, pageViews: 1 }
			} else {
				obj[log.Thread.id].pageViews++
			}

			return obj
		}, {})

		//Transform to array
		let pageViewsArr = Object.keys(pageViewsObj).map(id => {
			return pageViewsObj[id]
		})

		//Sort by number of page views descending
		let sortedPageViewsArr = pageViewsArr.sort((a, b) => {
			if(a.pageViews < b.pageViews) {
				return 1
			} else if (a.pageViews > b.pageViews) {
				return -1
			} else {
				return 0
			}
		})

		//Return top 3
		res.json(sortedPageViewsArr.slice(0, 3))

	} catch (e) {
		res.status(500)
		res.json({
			errors: [Errors.unknown]
		})
	}
})

module.exports = router