import { AnimationStep } from '../types';

export function setAnimationStatus(status: string, emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('animation-status-update', {
            bubbles: true,
            composed: true,
            detail: status,
        })
    );
}

export function dispatchAnimationEvent(emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('animate-graph', {
            bubbles: true,
            composed: true,
        })
    );
}

export function setAlgoEvent(emitter: EventTarget, algo: string) {
    emitter.dispatchEvent(
        new CustomEvent('algo-update', {
            bubbles: true,
            composed: true,
            detail: algo,
        })
    );
}

export function dispatchGraphReset(emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('reset-graph', {
            bubbles: true,
            composed: true,
        })
    );
}

export function setAnimationPosition(position: number, emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('animation-position-update', {
            bubbles: true,
            composed: true,
            detail: position,
        })
    );
}

export function setAnimation(animation: AnimationStep[], emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('animation-update', {
            bubbles: true,
            composed: true,
            detail: animation,
        })
    );
}

export function deleteAnimationStep(index: number, emitter: EventTarget) {
    emitter.dispatchEvent(
        new CustomEvent('delete-animation-step', {
            bubbles: true,
            composed: true,
            detail: index,
        })
    );
}