import { noop, safe_not_equal } from 'svelte/internal';

/** Callback to inform of a value updates. */
export type Subscriber<T> = (value: T) => void;

/** Unsubscribes from value updates. */
export type Unsubscriber = () => void;

/** Cleanup logic callback. */
export type Invalidator<T> = (value?: T) => void;

/** Pair of subscriber and invalidator. */
export type SubscribeInvalidateTuple<T> = [Subscriber<T>, Invalidator<T>];

/** Start and stop notification callbacks. */
export type StartStopNotifier<T> = (set: Subscriber<T>) => Unsubscriber | void;

/** Callback to update a value. */
export type Updater<T> = (value: T) => T;

/** Readable interface for subscribing. */
export class Readable<T> {
    protected _value: T;
	protected _subscribers: Set<SubscribeInvalidateTuple<T>> = new Set();
	protected static _subscriberQueue: Map<Invalidator<unknown>, unknown> = new Map();
    protected _start: StartStopNotifier<T>;
    protected _stop: Unsubscriber;

    constructor(value: T, startStopNotifier: StartStopNotifier<T>) {
        this._value = value;
        this._start = startStopNotifier;
    }

	protected _set(newValue: T): void {
		// Don't notify if the value hasn't changed.
		if (!safe_not_equal(this._value, newValue)) return;

		this._value = newValue;

		// There is no subscriber.
		if (!this._stop) return;

		// only run the invalidating section if there was no subscribers at the beginning.
		const runQueue = !Readable._subscriberQueue.size;
		for (const subscriber of this._subscribers) {
			const notify = subscriber[1];
			notify();
			const invalidate = subscriber[0];
			Readable._subscriberQueue.set(invalidate, this._value);
		}
		// invalidating section
		if (runQueue) {
			Readable._subscriberQueue.forEach((value: unknown, invalidate: Invalidator<unknown>) => {
				invalidate(value);
			});
			Readable._subscriberQueue.clear();
		}
	}

	_update(fn: Updater<T>): void {
		this._set(fn(this._value));
	}

	/**
	 * Subscribe on value changes.
	 * @param run subscription callback
	 * @param invalidate cleanup callback
	 */
     subscribe(run: Subscriber<T>, invalidate: Invalidator<T> = noop): Unsubscriber {
		const subscriber: SubscribeInvalidateTuple<T> = [run, invalidate];
		this._subscribers.add(subscriber);
		if (this._subscribers.size === 1) {
			this._stop = this._start(this['set'] ? this['set'] : undefined) || noop;
		}
		run(this._value);

		return () => {
			this._subscribers.delete(subscriber);
			if (this._subscribers.size === 0) {
				this._stop();
				this._stop = null;
			}
		};
	}
}

/**
 * Creates a `Readable` store that allows reading by subscription.
 * @param value initial value
 * @param start Start and stop notifications for subscriptions.
 * This function will be called once when the store gets a first subscriber
 * and then again when the store loses its last subscriber.
 */
 export function readable<T>(value?: T, start?: StartStopNotifier<T>): Readable<T> {
	return new Readable<T>(value, start);
}
