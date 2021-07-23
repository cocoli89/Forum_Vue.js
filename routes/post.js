let express = require('express')
let router = express.Router()

const Errors = require('../lib/errors')
let { User, Thread, Post } = require('../models')

router.all('*', (req, res, next) => {
	if(req.session.loggedIn) {
		next()
	} else {
		res.status(401)
		res.json({
			errors: [Errors.requestNotAuthorized]
		})
	}
})

router.post('/', async (req, res) => {
	let validationErrors = []
	let thread, replyingToPost, post

	try {
		if(req.body.content === undefined) {
			validationErrors.push(Errors.missingParameter('content'))
		} else if(typeof req.body.content !== 'string') {
			validationErrors.push(Errors.invalidParameterType('content', 'string'))
		} if (req.body.threadId === undefined) {
			validationErrors.push(Errors.missingParameter('threadId'))
		} else if(!Number.isInteger(req.body.threadId)) {
			validationErrors.push(Errors.invalidParameterType('threadId', 'integer'))
		} if(req.body.replyingToId !== undefined && !Number.isInteger(req.body.replyingToId)) {
			validationErrors.push(Errors.invalidParameterType('replyingToId', 'integer'))
		}

		if(validationErrors.length) throw Errors.VALIDATION_ERROR

		post = await Post.create({
			content: req.body.content
		})

		thread = await Thread.findOne({ where: {
			id: req.body.threadId
		}})
		user = await User.findOne({ where: {
			username: req.session.username
		}})

		if(!thread) throw Errors.invalidParameter('threadId', 'thread does not exist')

		await post.setUser(user)
		await post.setThread(thread)
		await thread.addPost(post)

		if(req.body.replyingToId) {
			replyingToPost = await Post.findOne({ where: {
				id: req.body.replyingToId
			}, include: [Thread] })

			if(!replyingToPost) {
				throw Errors.invalidParameter('replyingToId', 'post does not exist')
			} else if(replyingToPost.Thread.id !== thread.id) {
				throw Errors.invalidParameter('replyingToId', 'replies must be in same thread')
			} else {
				await post.setReplyingTo(replyingToPost)
				await replyingToPost.addReplies(post)
			}
		}

		res.json(await post.reload({
			include: [
				{ model: User, attributes: ['username', 'createdAt', 'updatedAt', 'id'] }, 
				Thread,
				{ model: Post, as: 'ReplyingTo', include:
					[{ model: User, attributes: ['username', 'createdAt', 'updatedAt', 'id'] }]
				}
			]
		}))
	} catch (e) {
		if(e === Errors.VALIDATION_ERROR) {
			res.status(400)
			res.json({
				errors: validationErrors
			})
		} else if(e.name === 'invalidParameter') {
			res.status(400)
			res.json({
				errors: [e]
			})
		} else {
			console.log(e)
			res.status(500)
			res.json({
				errors: [Errors.unknown]
			})
		}
	}
})

module.exports = router