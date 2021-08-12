import { noop } from 'svelte/internal';
import { Readable, StartStopNotifier, Updater } from './readable';

/** Writable interface for both updating and subscribing. */
export class Writable<T> extends Readable<T> {
    constructor(value: T, startStopNotifier: StartStopNotifier<T>) {
        super(value, startStopNotifier);
    }

    /**
     * Set value and inform subscribers.
     * @param newValue to set
     */
    set(newValue: T): void {
        this._set(newValue);
    }

    /**
     * Update value using callback and inform subscribers.
     * @param fn callback to update value
     */
    update(fn: Updater<T>): void {
        this._update(fn);
    }
}

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 * @param value initial value
 * @param startStopNotifier Start and stop notifications for subscriptions.
 * This function will be called once when the store gets a first subscriber
 * and then again when the store loses its last subscriber.
 */
// Keep this documentation in sync with readable<T>(...).
export function writable<T>(value?: T, startStopNotifier: StartStopNotifier<T> = noop): Writable<T> {
    return new Writable(value, startStopNotifier);
}
