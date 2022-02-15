const axios = require('axios').default;
const HOST = 'https://game-of-life-service-ai3nmiz7aa-uc.a.run.app'
// const HOST = 'http://localhost:8080'

const LIFE_FILTER = [
  [-1, -1], [-1, 0], [-1, 1],
  [ 0, -1],          [ 0, 1],
  [ 1, -1], [ 1, 0], [ 1, 1]
]
const DEATH = 0
const LIFE = 1

const lifeTick = ({generation = 0, maxGenerations, world, afterTick}) => {
  const worldSize = world[0].length;
  if(afterTick === undefined) {
    afterTick = () => {};
  }

  let nextWorld = new Array(worldSize);

  for(let rowIndex = 0; rowIndex < worldSize; rowIndex++){
    nextWorld[rowIndex] = new Array(worldSize);
    for(let columnIndex = 0; columnIndex < worldSize; columnIndex++) {
      const self = world[rowIndex][columnIndex];
      let neighbors = LIFE_FILTER.reduce((sum, offset) => {
        const [row, col] = [offset[0] + rowIndex, offset[1] + columnIndex];
        if (row < 0 || row > worldSize - 1 || col < 0 || col > worldSize - 1) return sum;
        return sum + (!!world[row][col] ? 1 : 0)
      }, 0)

      let outcome = DEATH;
      // Any live cell with fewer than two live neighbours dies, as if by underpopulation.
      // Any live cell with more than three live neighbours dies, as if by overpopulation.
      if(self == LIFE && (neighbors < 2 || neighbors > 3)) {
        outcome = DEATH
      }
      // Any live cell with two or three live neighbours lives on to the next generation.
      if(self == LIFE && (neighbors == 2 || neighbors == 3)) {
         outcome = LIFE;
      }
      // Any dead cell with exactly three live neighbours becomes a live cell, as if by reproduction.
      if(self == DEATH && neighbors == 3) {
        outcome = LIFE;
      }
      nextWorld[rowIndex][columnIndex] = outcome;
    }
  }

  afterTick(nextWorld, generation);

  if(generation < maxGenerations){
    if(JSON.stringify(world) === JSON.stringify(nextWorld)){
      console.log(`Frozen world ending at ${generation} generations`)
      return
    }
    lifeTick({generation: generation + 1, maxGenerations, world: nextWorld, afterTick})
  } else {
    console.log('generations done!')
  }
}

// axios.get(`${HOST}/world/`).then(response => {
  axios.get(`${HOST}/world/ebDlTD-q`).then(response => {
  let results = []
  let {id, generationCount, size, world} = response.data;
  // generationCount = 600;
  console.log({generationCount, size, id})
  lifeTick({generation: 0, maxGenerations: generationCount, world, afterTick: (world, generation) => {
    results.push(world)
  }})

  console.log('writing game');
  axios.post(`${HOST}/results/`, {id, generationCount: results.length, generations: results}, {maxRedirects: 0})
       .then((r)=>console.log('post complete', r.data))
       .catch((e) => {
         if(e.response.status = 302) {
           console.log('redirect', e.response.status, e.response.data);
         } else {
           console.error('error', e.response.status, e.response.data);
         }
       });
})
