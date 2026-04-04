export async function delay(ms: number) {
	// return await for better async stack trace support in case of errors.
	return await new Promise((resolve) => setTimeout(resolve, ms));
}

export function cancellableDelay(
	ms: number,
	signal?: AbortSignal,
): Promise<void> {
	if (!signal) return delay(ms) as Promise<void>;
	return new Promise((resolve, reject) => {
		if (signal.aborted) {
			reject(new DOMException("Aborted", "AbortError"));
			return;
		}
		const id = setTimeout(resolve, ms);
		signal.addEventListener(
			"abort",
			() => {
				clearTimeout(id);
				reject(new DOMException("Aborted", "AbortError"));
			},
			{ once: true },
		);
	});
}
