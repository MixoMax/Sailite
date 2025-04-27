from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.exceptions import HTTPException
import os
import uvicorn
import sys

app = FastAPI()

@app.get("/{path:path}")
async def serve_file(path: str):
    if path == "":
        path = "index.html"
    
    file_path = os.path.join(os.path.dirname(__file__), "static", path)
    if os.path.exists(file_path):
        return FileResponse(file_path)
    else:
        raise HTTPException(status_code=404, detail="File not found")


if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1:
        port = int(sys.argv[1])
        
    uvicorn.run(app, host="0.0.0.0", port=port)
