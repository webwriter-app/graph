import { AnimationStep } from '../model/types';

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