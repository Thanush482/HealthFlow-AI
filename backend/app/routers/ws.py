from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..services import state

router = APIRouter()


@router.websocket("/ws/state")
async def ws_state(websocket: WebSocket):
    await state.manager.connect(websocket)
    try:
        while True:
            # Dashboard doesn't need to send anything; just keep the socket alive.
            await websocket.receive_text()
    except WebSocketDisconnect:
        state.manager.disconnect(websocket)
