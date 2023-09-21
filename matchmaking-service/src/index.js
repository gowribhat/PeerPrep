import { WebSocketServer } from "ws";
import { getUserFromToken } from "./authorization.js";
import { cancelFindMatchRequest } from "./handlers.js";
import {
  enqueueFindMatch,
  subscribeMatchResponse,
  unsubscribeMatchResponse,
} from "./rabbitmq.js";

const wss = new WebSocketServer({ port: process.env.PORT });
const difficulties = ["easy", "medium", "hard"];

wss.on("connection", async (ws, request) => {
  try {
    const token = request.headers.authorization;
    if (!token) {
      console.log("Token cannot be found in authorization header.");
      return ws.close(1008, "Unauthorized");
    }

    let user = await getUserFromToken(token);
    if (!user) {
      console.log("Invalid token found in authorization header.");
      return ws.close(1008, "Unauthorized");
    }

    const urlSearchParams = new URLSearchParams(request.url.substring(1));
    const difficulty = urlSearchParams.get("difficulty");
    if (!difficulty || !difficulties.includes(difficulty.toLowerCase())) {
      console.log("Difficulty is missing from search params or is incorrect.");
      return ws.close(1000);
    }

    const matchResponseHandler = async (response) => {
      const { users, difficulty } = response;
      const matchedUser = users.filter((userId) => userId !== user.id)[0];
      ws.close(1000, JSON.stringify({ matchedUser, difficulty }));
      return true;
    };

    await subscribeMatchResponse(user.id, matchResponseHandler);
    await enqueueFindMatch(user.id, difficulty.toLowerCase());

    ws.on("close", async () => {
      await cancelFindMatchRequest(user.id, difficulty);
      await unsubscribeMatchResponse(user.id);
    });
  } catch (error) {
    console.error(error);
    return ws.close(1011, "Internal Server Error");
  }
});