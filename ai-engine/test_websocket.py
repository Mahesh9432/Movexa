
import asyncio
import json
import websockets


async def test_connection():

    uri = "ws://127.0.0.1:8000/ws/ai/live"

    async with websockets.connect(uri) as websocket:

        test_data = {
            "exercise": "Squat",
            "repetitions": 5,
            "current_phase": "STANDING",
            "knee_angle": 170.5,
            "feedback": "Stand straight"
        }

        await websocket.send(json.dumps(test_data))

        response = await websocket.recv()

        print("Server Response:")
        print(response)


if __name__ == "__main__":
    asyncio.run(test_connection())
