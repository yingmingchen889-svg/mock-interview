import { AccessToken, RoomServiceClient } from "livekit-server-sdk";

function getConfig() {
  const livekitHost = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitHost || !apiKey || !apiSecret) {
    throw new Error("LiveKit environment variables are not configured");
  }

  return { livekitHost, apiKey, apiSecret };
}

let _roomService: RoomServiceClient | null = null;

export function getRoomService(): RoomServiceClient {
  if (!_roomService) {
    const { livekitHost, apiKey, apiSecret } = getConfig();
    _roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
  }
  return _roomService;
}

export async function createInterviewRoom(
  roomName: string,
  metadata: string
): Promise<void> {
  await getRoomService().createRoom({
    name: roomName,
    emptyTimeout: 300,
    maxParticipants: 2,
    metadata,
  });
}

export async function generateUserToken(
  roomName: string,
  userId: string,
  userName: string
): Promise<string> {
  const { apiKey, apiSecret } = getConfig();
  const token = new AccessToken(apiKey, apiSecret, {
    identity: userId,
    name: userName,
  });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });
  return await token.toJwt();
}
