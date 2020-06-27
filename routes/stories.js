const express = require('express')
const router = express.Router()
const { ensureAuth } = require('../middleware/auth')
const Story = require('../models/Story')
const User = require('../models/User')

// @desc    Show add page
// @route   GET /stories/add
router.get('/add', ensureAuth, (req, res) => {
    res.render('stories/add')
})

// @desc    Process add form
// @route   POST /stories
router.post('/', ensureAuth, async (req, res) => {
    try {
        req.body.user = req.user.id
        await Story.create(req.body)
        res.redirect('/dashboard')
    } catch (err) {
        res.render('errors/500')
    }
})

// @desc    Show all stories
// @route   GET /stories
router.get('/', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({ status: 'public' })
            .populate('user')
            .sort({ createdAt: 'desc' })
            .lean()
        res.render('stories/index', {
            stories,
        })
    } catch (err) {
        res.render('errors/500')
    }
})

// @desc    Show single story
// @route   GET /stories/:id
router.get('/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id)
            .populate('user')
            .lean()
        
        const cmts = story.comments
    
        
        if (!story) {
            return res.render('errors/404')
        }

        res.render('stories/show', {
            story,
            cmts,
        })
    } catch (err) {
        return res.render('errors/404')
    }
})

// @desc    Show User stories
// @route   GET /stories/user/:userId
router.get('/user/:userId', ensureAuth, async (req, res) => {
    try {
        const stories = await Story.find({
            user: req.params.userId,
            status: 'public'
        })
            .populate('user')
            .lean()
        res.render('stories/index', {
            stories
        })
    } catch (err) {
        return res.render('errors/404')
    }
})
// @desc    Show edit page
// @route   GET /stories/edit/:id
router.get('/edit/:id', ensureAuth, async (req, res) => {
    const story = await Story.findOne({
        _id: req.params.id,
    }).lean()

    if (!story) {
        return res.render('errors/404')
    }

    if (story.user != req.user.id) {
        res.redirect('/stories')
    } else {
        res.render('stories/edit', {
            story,
        })
    }
})

// @desc    Update story
// @route   PUT /stories/:id
router.put('/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean()

        if (!story) {
            return res.render('errors/404')
        }

        if (story.user != req.user.id) {
            res.redirect('/stories')
        } else {
            story = await Story.findOneAndUpdate({ _id: req.params.id }, req.body, { new: true, runValidators: true })
        }

        res.redirect('/dashboard')
    } catch (err) {
        return res.render('errors/500')
    }
    
})

// @desc    Add comment
// @route   PUT /stories/comment/:id/:userId
router.put('/comment/:id/:userId', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id)
        const user = await User.findById(req.params.userId)
        const userName = user.displayName
        const message = req.body.autocompleteInput
        if (!story) return res.render('errors/404')
        const comment = { userName, message }
        console.log(comment)
        let cmts = story.comments
        cmts.unshift(comment)
        await Story.findOneAndUpdate({ _id: req.params.id }, { comments: cmts }, { new: true })
        res.redirect('back')
    } catch (err) {
        res.render('errors/500')
    }
})
// @desc    Like story
// @route   PUT /stories/like/:id
router.put('/like/:id/:userId', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean()
        const idUser = req.params.userId
        let fanats = story.fans

        if (fanats.includes(idUser)) {
            let removeLikes = story.likes - 1
            updatedFans = fanats.filter(fan => fan != idUser)
            await Story.findOneAndUpdate({ _id: req.params.id }, { likes: removeLikes, fans: updatedFans }, { new: true })
        } else {
            let addLikes = story.likes + 1
            fanats.push(idUser)
            await Story.findOneAndUpdate({ _id: req.params.id }, { likes: addLikes, fans: fanats }, { new: true })
        }

        res.redirect('/stories')
    } catch (err) {
        return res.render('errors/500')
    }
})

// @desc    Delete story
// @route   DELETE /stories/:id
router.delete('/:id', ensureAuth, async (req, res) => {
    try {
        let story = await Story.findById(req.params.id).lean()
        
        if (!story) {
            res.render('errors/404')
        }

        if (story.user != req.user.id) {
            res.redirect('stories')
        } else {
            await Story.remove({ _id: req.params.id })
            res.redirect('/dashboard')
        }
    } catch (err) {
        return res.render('errors/500')
    }
})

module.exports = router
