# RSSchool NodeJS websocket task template
> Static http server and base task packages. 
> By default WebSocket client tries to connect to the 3000 port.

## Installation
1. Clone/download repo
2. `npm install`

## Usage
**Development**

`npm run start:dev`

* App served @ `http://localhost:8181` with ts-node-dev
* WebSocket Server listens port 3000

**Production**

`npm run start`

* App served @ `http://localhost:8181` with ts-node
* WebSocket Server listens port 3000

---

**All commands**

Command | Description
--- | ---
`npm run start:dev` | App served @ `http://localhost:8181` (WebSocket server on port 3000) with ts-node-dev
`npm run start` | App served @ `http://localhost:8181` (WebSocket server on port 3000) with ts-node

**Note**: replace `npm` with `yarn` in `package.json` if you use yarn.
