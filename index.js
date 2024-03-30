require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const app = express();

const port = process.env.PORT || 5000;

app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With, Access-Control-Allow-Headers, Content-Type, Authorization, Origin, Accept"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  next();
});

const corsOptions = {
  origin: ["http://localhost:3000"],
};

app.use(cors(corsOptions));

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e5zetpl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const db = await client.db("taskmaster");
    const tasksCollection = db.collection("tasks");
    const usersCollection = db.collection("users");

    console.log("Successfully connected to MongoDB!");

    app.get("/", (req, res) => {
      res.send("Task Master Server");
    });

    app.get("/tasks", async (req, res) => {
      try {
        const tasks = await tasksCollection.find({}).toArray();
        res.json(tasks);
      } catch (err) {
        console.error("Error fetching tasks:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // find tasks filtering by email
    app.get("/tasks/:email", async (req, res) => {
      try {
        const email = req.params.email;
        // Find tasks associated with the given email
        const tasks = await tasksCollection
          .find({ assignedTo: email })
          .toArray();
        res.json(tasks);
      } catch (error) {
        console.error("Error fetching tasks by email:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.post("/tasks", async (req, res) => {
      const newTask = req.body;

      try {
        const result = await tasksCollection.insertOne(newTask);
        res.status(201).json(result);
      } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    // user post api
    app.post("/users", async (req, res) => {
      const newUser = req.body;

      try {
        const result = await usersCollection.insertOne(newUser);
        res.status(201).json(result);
      } catch (err) {
        console.error("Error creating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });

    app.get("/users", async (req, res) => {
      try {
        const users = await usersCollection.find({}).toArray();
        res.send(users);
      } catch (error) {
        res.status(500).json({ error: "Internal Server Error!" });
      }
    });

    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params?.id;
      const result = await tasksCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.patch("/tasks/:id", async (req, res) => {
      const taskId = req.params.id;
      const updatedTaskData = req.body;

      try {
        const result = await tasksCollection.updateOne(
          { _id: new ObjectId(taskId) },
          { $set: updatedTaskData }
        );

        if (result.matchedCount === 0) {
          res.status(404).json({ error: "Task not found" });
        } else {
          res.json({ message: "Task updated successfully" });
        }
      } catch (err) {
        console.error("Error updating task:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
  } finally {
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
