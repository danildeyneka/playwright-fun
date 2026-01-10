const randomDelay = (min: number = 1000, max: number = 4000) => Math.floor(Math.random() * (max - min)) + min;

export const sleep = () => new Promise(resolve => setTimeout(resolve, randomDelay(200, 500)));