const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const session = require('express-session');
const path = require('path');

dotenv.config();

const app = express();

// Set the views directory path
app.set('views', path.join(__dirname, 'views'));

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Set up MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error(`Error connecting to MongoDB: ${err}`);
  });

// Define user schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  sessionLink: { type: String, required: true },
  materialLinks: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware function to check if the user is logged in
const requireLogin = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Homepage - public route
app.get('/', (req, res) => {
  res.render('home');
});

// // Signup page - public route
// app.get('/signup', (req, res) => {
//   res.render('signup', { error: null });
// });

// // Signup form submission - public route
// app.post('/signup', async (req, res) => {

//   try {
//     console.log('ahmed')
//     const { username, password } = req.body;

//     const userExists = await User.findOne({ username });
//     if (userExists) {
//       return res.render('signup', { error: 'User already exists' });
//     }

//     const user = new User({
//       username,
//       password,
//     });
//     await user.save();

//     res.redirect('/login');
//   } catch (err) {
//     console.error(err);
//     res.status(500).send('Server error');
//   }
// });

// Login page - public route
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Login form submission - public route
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user || password !== user.password) {
      return res.render('login', { error: 'Invalid username or password' });
    }

    // Check if the user is the admin
    if (username === 'admin' && password === 'admin') {
      console.log('Admin logged in');
      return res.redirect('/admin0');
    }


    req.session.userId = user._id;

    res.redirect('/main');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
app.get('/main', requireLogin, async (req, res) => {
  try {
    // Retrieve the user's name and sessionLinks from the database
    const user = await User.findById(req.session.userId);
    const userName = user.username;
    const sessionLinks = user.sessionLink;
    const materialLinks = user.materialLinks;


    // Retrieve the materials from the database
    // const materials = await User.find();

    // Render the main view with the user's name, sessionLinks, and materials
    res.render('main', { userName, sessionLinks, materialLinks });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
app.get('/admin0', async (req, res) => {
  console.log('/admin route called');
  const users = await User.find();
  res.render('admin', { users });
});

app.get('/edit/:id', async (req, res) => {
  console.log('ahmed')
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    res.render('edit', { user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/edit/:id', async (req, res) => {
  console.log('ahmed1111111111111')
  const { id } = req.params;
  const { username, password, sessionLink, materialLinks } = req.body;
  try {
    await User.findByIdAndUpdate(id, { username, password ,sessionLink ,materialLinks});
    res.redirect('/admin0');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.get('/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await User.findByIdAndDelete(id);
    res.redirect('/admin0');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

// Add user page - protected route
app.get('/add-user', (req, res) => {
  res.render('add-user');
});

// Logout - protected route
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Add user form submission - protected route
app.post('/add-user', async (req, res) => {
  const { username, password ,sessionLink ,materialLinks} = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.render('add-user', { error: 'User already exists' });
    }

    const user = new User({
      username,
      password,
      sessionLink,
      materialLinks,
    });
    await user.save();

    res.redirect('/admin0');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});
// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});