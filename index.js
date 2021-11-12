const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
// app.use(bodyParser.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.8vsmo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

console.log(uri);

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function run() {
  try {
    await client.connect();
    console.log('database connected');

    const database = client.db('doctors_portal');
    const appointmentsCollection = database.collection('appointments');
    const usersCollection = database.collection('users');

    // GET Appointments
    app.get('/appointments', async (req, res) => {
      const email = req.query.email;
      const date = req.query.date;
      // const query = { email: email, date: date };
      // Object Shorthand
      const query = { email, date };
      const cursor = appointmentsCollection.find(query);
      const result = await cursor.toArray();
      res.json(result);
    });

    // POST Appointments
    app.post('/appointments', async (req, res) => {
      const appointment = req.body;
      const result = await appointmentsCollection.insertOne(appointment);
      res.json(result);
      // res.send('appointment found');
      // res.json({ message: 'appointment found' });
    });

    // GET A User and Check if that User is Admin
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      let admin = false;
      if (user?.role === 'admin') {
        admin = true;
      }
      res.json({ admin });
    });

    // POST Users
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await usersCollection.insertOne(user);
      console.log(result, 'res');
      res.json(result);
    });

    // PUT Users [Upsert Google User]
    app.put('/users', async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = { $set: user };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // PUT Users [Update User to Make Admin]
    app.put('/users/admin', async (req, res) => {
      const email = req.body.email;
      const filter = { email };
      const updateDoc = { $set: { role: 'admin' } };
      const result = await usersCollection.updateOne(filter, updateDoc);
      // console.log(result);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hello Doctors Portal!');
});

app.get('/doctors/:did', (req, res) => {
  console.log(req.params.did);
  res.send(req.params.did);
});

app.listen(port, () => {
  console.log(`listening at ${port}`);
});
