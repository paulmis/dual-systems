# dual-systems

Dual systems is an interactive, strategy-oriented, planetary system map for Dual Universe. DS enables more interesting p2p interactions by showing the positions of players and their structures. Individual players can visualize routes, access depot and market data, while organizations can manage their assets and coordinate movements.

<p align="center">
  <img src="https://i.imgur.com/KVkINAb.jpg" />
</p>

### Features
- [x] map of the system
- [ ] travel calculators (distance, time, fuel, pipeline avoidance)
- [ ] points of interests (markets, starbases, warp points, asteroids)
- [ ] organization panels
- [ ] live player/ship tracking
- [ ] real-time market data

## How to run
Simply clone the project and run the node environment:
```
wget https://github.com/paulmis/dual-systems.git
node index.js
```
The map will then be accessible on `localhost:8080`.

### Navigation
The map can be navigated with WASD keys or using the touch controls. Users can:
- [x] see detailed entity data when hovering over
- [x] filter entities (plantary bodies, stations, ships)
- [ ] plan travel between bodies by using the planning mode
- [ ] access station/market data
