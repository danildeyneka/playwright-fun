const randomDelay = (min: number = 1000, max: number = 4000) => Math.floor(Math.random() * (max - min)) + min;

export const sleep = async (ms?: number) => new Promise(resolve => setTimeout(resolve, ms || randomDelay()));

export const sleepAbit = () => sleep(randomDelay(200, 400));