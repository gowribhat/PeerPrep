import dotenv from "dotenv";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import mongoose from "mongoose";
import QuestionRouter from "./routes/questionRoutes.js";
import { createQuestionCounter, getNextQuestionId } from "./controllers/questionCounter.js";

dotenv.config("./.env");
const uri = process.env.MONGO_OPTION == "cloud" ? process.env.MONGO_CLOUD_URI : process.env.MONGO_LOCAL_DOCKER_URI;
const port = process.env.PORT || 3001;
const connectionOptions = {dbName: `peerprep-database`};

const app = express();

console.log(uri);

mongoose.connect(uri, connectionOptions)
  .then(() => {
    console.log("Successfully connected to MonogDB!");
  }).catch((error) => {
    console.log(`Failed to connect to MongoDB!`);
    throw error;
  });

app.use(cors());
app.use(express.json());
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('tiny'));
};

createQuestionCounter();

//app.use('/api/question', QuestionRouter);
app.use('/', QuestionRouter);

app.listen(port, () => {
    console.log(`Question Service is running on port: ${port}`);
});
