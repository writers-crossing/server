export class TimerTracker {
    ended: boolean = false
}

export class Store {
    timers: Map<string, TimerTracker | null> = new Map<string, TimerTracker | null>()
}

export const store = new Store()