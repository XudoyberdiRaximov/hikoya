const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const morgan = require('morgan')
const path = require('path')
const methodOverride = require('method-override')
const passport = require('passport')
const exphbs = require('express-handlebars')
const session = require('express-session')
const connectDB = require('./config/db')
const MongoStore = require('connect-mongo')(session)

// Load config
dotenv.config({ path: './config/config.env' })

// Passport config
require('./config/passport')(passport)

connectDB()

const app = express()

// Body parser
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Method override
app.use(methodOverride(function (req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        // look in urlencoded POST bodies and DELETE it 
        let method = req.body._method
        delete req.body._method
        return method
    }
}))
// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

// Static folder
app.use(express.static(path.join(__dirname, 'public')))

// Handlebars helpers
const { formatDate, stripTags, truncate, editIcon, select, likeStory } = require('./helpers/hbs')

// Handlebars
app.engine(
    '.hbs',
    exphbs({
        helpers: {
            formatDate,
            stripTags,
            truncate,
            editIcon, 
            select,
            likeStory,
        },
        defaultLayout: 'main',
        extname: '.hbs',
    }))
app.set('view engine', '.hbs')

// Sessions
app.use(session({
    secret: 'rockatanskiy',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
}))
// Passport middleware
app.use(passport.initialize())
app.use(passport.session())

// Set global var
app.use(function (req, res, next) {
    res.locals.user = req.user || null
    next()
})

// Routes
app.use('/', require('./routes/index'))
app.use('/auth', require('./routes/auth'))
app.use('/stories', require('./routes/stories'))

const PORT = process.env.PORT || 7000

app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`)
)