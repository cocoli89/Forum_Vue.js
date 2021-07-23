process.env.NODE_ENV = 'test'

let chai = require('chai')
let server = require('../server')
let should = chai.should()

let { sequelize, Log } = require('../models')

const Errors = require('../lib/errors.js')

chai.use(require('chai-http'))
chai.use(require('chai-things'))

describe('Log', () => {
	let admin = chai.request.agent(server)
	let user = chai.request.agent(server)

	//Wait for app to start before commencing
	before((done) => {
		if(server.locals.appStarted) done()
			
		server.on('appStarted', () => {
			done()
		})
	})

	describe('POST /', () => {
		before(async () => {
			try {
				await admin
					.post('/api/v1/user')
					.set('content-type', 'application/json')
					.send({
						username: 'adminaccount',
						password: 'password',
						admin: true
					})

				await admin
					.post('/api/v1/user')
					.set('content-type', 'application/json')
					.send({
						username: 'useraccount',
						password: 'password'
					})

				await admin
					.post('/api/v1/category')
					.set('content-type', 'application/json')
					.send({ name: 'category' })

				await admin
					.post('/api/v1/thread')
					.set('content-type', 'application/json')
					.send({ category: 'CATEGORY', name: 'thread' })

					await admin
						.post('/api/v1/post')
						.set('content-type', 'application/json')
						.send({ threadId: 1, content: 'post' })

				return true
			} catch (e) {
				return e
			}
		})

		it('should create a log for index route', async () => {
			let res = await chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'index' })

			res.should.have.status(200)
			res.should.be.json
			res.body.should.have.property('id', 1)
			res.body.should.have.property('route', 'index')
			res.body.should.have.property('UserId', null)
			res.body.should.have.property('ThreadId', null)

			let log = await Log.findById(res.body.id)
			log.should.not.be.null
			log.should.have.property('route', 'index')
		})
		it('should create a log for settingsAccount route', async () => {
			let res = await user
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'settingsAccount' })

			res.should.have.status(200)
			res.should.be.json

			let log = await Log.findById(res.body.id)
			log.should.have.property('route', 'settingsAccount')
			log.should.have.property('SessionUserId', 2)
		})
		it('should create a log for thread route', async () => {
			let res = await chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'thread', resourceId: 1 })

			res.should.have.status(200)
			res.should.be.json

			let log = await Log.findById(res.body.id)
			log.should.have.property('route', 'thread')
			log.should.have.property('ThreadId', 1)
		})
		it('should create a log for userPosts route', async () => {
			let res = await chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'thread', resourceId: 1 })

			res.should.have.status(200)
			res.should.be.json

			let log = await Log.findById(res.body.id)
			log.should.have.property('route', 'thread')
			log.should.have.property('UserId', 1)
		})

		it('should return an error if invalid route', done => {
			chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'not a route' })
				.end((err, res) => {
					res.should.have.status(400)
					res.body.errors.should.contain.something.with.property('message', 'route does not exist')

					done()
				})
		})
		it('should return an error if invalid id for thread route', done => {
			chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'thread', resourceId: 404 })
				.end((err, res) => {
					res.should.have.status(400)
					res.body.errors.should.contain.something.with.property('message', 'thread does not exist')

					done()
				})
		})
		it('should return an error if invalid id for userPosts route', done => {
			chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'userPosts', resourceId: 404 })
				.end((err, res) => {
					res.should.have.status(400)
					res.body.errors.should.contain.something.with.property('message', 'user does not exist')

					done()
				})
		})
		it('should return an error if invalid id for userThreads route', done => {
			chai.request(server)
				.post('/api/v1/log')
				.set('content-type', 'application/json')
				.send({ route: 'userThreads', resourceId: 404 })
				.end((err, res) => {
					res.should.have.status(400)
					res.body.errors.should.contain.something.with.property('message', 'user does not exist')

					done()
				})
		})

	})

	after(() => sequelize.sync({ force: true }))
})