let express = require('express')
let router = express.Router()

const Errors = require('../lib/errors.js')
let { User, Thread, Category } = require('../models')

router.all('*', (req, res, next) => {
	if(req.session.loggedIn) {
		next()
	} else {
		res.status(401)
		res.json({
			errors: Errors.requestNotAuthorized
		})
	}
})

router.post('/', async (req, res) => {
	try {
		let validationErrors = []

		if(req.body.name === undefined) {
			validationErrors.push(Errors.missingParameter('name'))
		} else if(typeof req.body.name !== 'string') {
			validationErrors.push(Errors.invalidParameterType('name', 'string'))
		}

		if(req.body.category === undefined) {
			validationErrors.push(Errors.missingParameter('category'))
		} else if(typeof req.body.category !== 'string') {
			validationErrors.push(Errors.invalidParameterType('category', 'string'))
		}

		if(validationErrors.length) throw Errors.VALIDATION_ERROR

		let category = await Category.findOne({ where: {
			name: req.body.category
		}})

		if(!category) throw Errors.invalidCategory

		let user = await User.findOne({ where: {
			username: req.session.username	
		}})

		let thread = await Thread.create({
			name: req.body.name
		})

		await thread.setCategory(category)
		await thread.setUser(user)

		res.json(thread.toJSON())

	} catch (e) {
		switch (e) {
			case Errors.VALIDATION_ERROR:
				res.status(400)
				res.json({
					errors: validationErrors
				})
				break
			case Errors.invalidCategory
				res.status(401)
				res.json({
					errors: [Errors.invalidCategory]
				})
			default:
				res.status(500)
				res.json({
					errors: [Errors.unknown]
				}) 
		}
	}
})

module.exports = router