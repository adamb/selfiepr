/**
 * Replicate API Client
 * Wrapper for Replicate API calls
 */

export interface TrainingInput {
	input_images: string; // URL to zip file
	trigger_word: string;
	steps: number;
}

export interface TrainingOutput {
	weights: string; // URL to trained weights
}

export interface TrainingMetrics {
	predict_time: number;
	hardware: string;
}

export interface PredictionInput {
	prompt: string;
	/** Full "owner/name:versionHash" for the trained destination model */
	modelVersion: string;
}

export interface ReplicateClient {
	ensureModel(owner: string, name: string): Promise<void>;
	startTraining(
		input: TrainingInput,
		webhookUrl: string,
		destination: string
	): Promise<{ id: string }>;
	startPrediction(input: PredictionInput, webhookUrl: string): Promise<{ id: string }>;
	getTrainingStatus(id: string): Promise<{
		status: string;
		output?: TrainingOutput;
		error?: string;
		metrics?: TrainingMetrics;
	}>;
	getPredictionStatus(id: string): Promise<{
		status: string;
		output?: string[];
		error?: string;
		metrics?: TrainingMetrics;
	}>;
}

const FLUX_TRAINER_VERSION =
	'd995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944';

export function getReplicateClient(apiToken: string): ReplicateClient {
	const baseUrl = 'https://api.replicate.com/v1';

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${baseUrl}${path}`, {
			...options,
			headers: {
				Authorization: `Bearer ${apiToken}`,
				'Content-Type': 'application/json',
				...options.headers
			}
		});

		if (!response.ok) {
			const error = await response.text();
			throw new Error(`Replicate API error: ${response.status} - ${error}`);
		}

		return response.json();
	}

	return {
		async ensureModel(owner: string, name: string) {
			const getRes = await fetch(`${baseUrl}/models/${owner}/${name}`, {
				headers: { Authorization: `Bearer ${apiToken}` }
			});
			if (getRes.ok) return;
			if (getRes.status !== 404) {
				const error = await getRes.text();
				throw new Error(`Replicate API error: ${getRes.status} - ${error}`);
			}

			await fetchApi('/models', {
				method: 'POST',
				body: JSON.stringify({
					owner,
					name,
					visibility: 'private',
					hardware: 'cpu'
				})
			});
		},

		async startTraining(input: TrainingInput, webhookUrl: string, destination: string) {
			const response = await fetchApi<{ id: string }>(
				`/models/ostris/flux-dev-lora-trainer/versions/${FLUX_TRAINER_VERSION}/trainings`,
				{
					method: 'POST',
					body: JSON.stringify({
						destination,
						input: {
							input_images: input.input_images,
							trigger_word: input.trigger_word,
							steps: input.steps
						},
						webhook: webhookUrl,
						webhook_events_filter: ['start', 'completed']
					})
				}
			);

			return response;
		},

		async startPrediction(input: PredictionInput, webhookUrl: string) {
			// Trained Flux LoRA destinations are invoked by version id, not via
			// black-forest-labs/flux-dev-lora + hf_lora (that returns 422).
			const response = await fetchApi<{ id: string }>('/predictions', {
				method: 'POST',
				body: JSON.stringify({
					version: input.modelVersion.includes(':')
						? input.modelVersion.split(':')[1]
						: input.modelVersion,
					input: {
						prompt: input.prompt
					},
					webhook: webhookUrl,
					webhook_events_filter: ['start', 'completed']
				})
			});

			return response;
		},

		async getTrainingStatus(id: string) {
			return fetchApi(`/trainings/${id}`);
		},

		async getPredictionStatus(id: string) {
			return fetchApi(`/predictions/${id}`);
		}
	};
}
