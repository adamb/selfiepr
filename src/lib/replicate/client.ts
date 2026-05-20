/**
 * Replicate API Client
 * Wrapper for Replicate API calls
 */

const REPLICATE_API_VERSION = '2024-12-01';

interface ReplicateResponse<T> {
	data: T;
}

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
	hf_lora: string; // URL to LoRA weights
}

export interface ReplicateClient {
	startTraining(input: TrainingInput, webhookUrl: string): Promise<{ id: string }>;
	startPrediction(input: PredictionInput, webhookUrl: string): Promise<{ id: string }>;
	getTrainingStatus(id: string): Promise<{ status: string; output?: TrainingOutput; error?: string; metrics?: TrainingMetrics }>;
	getPredictionStatus(id: string): Promise<{ status: string; output?: string[]; error?: string; metrics?: TrainingMetrics }>;
}

export function getReplicateClient(apiToken: string): ReplicateClient {
	const baseUrl = 'https://api.replicate.com/v1';

	async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
		const response = await fetch(`${baseUrl}${path}`, {
			...options,
			headers: {
				'Authorization': `Bearer ${apiToken}`,
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
		async startTraining(input: TrainingInput, webhookUrl: string) {
			// Flux Dev LoRA Trainer
			const response = await fetchApi<{ id: string }>(
				'/models/ostris/flux-dev-lora-trainer/versions/d995297071a44dcb72244e6c19462111649ec86a9646c32df56daa7f14801944/trainings',
				{
					method: 'POST',
					body: JSON.stringify({
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
			// Flux Dev with LoRA
			const response = await fetchApi<{ id: string }>(
				'/predictions',
				{
					method: 'POST',
					body: JSON.stringify({
						model: 'black-forest-labs/flux-dev-lora',
						input: {
							prompt: input.prompt,
							hf_lora: input.hf_lora
						},
						webhook: webhookUrl,
						webhook_events_filter: ['start', 'completed']
					})
				}
			);

			return response;
		},

		async getTrainingStatus(id: string) {
			const response = await fetchApi<{
				status: string;
				output?: TrainingOutput;
				error?: string;
				metrics?: TrainingMetrics;
			}>(`/trainings/${id}`);

			return response;
		},

		async getPredictionStatus(id: string) {
			const response = await fetchApi<{
				status: string;
				output?: string[];
				error?: string;
				metrics?: TrainingMetrics;
			}>(`/predictions/${id}`);

			return response;
		}
	};
}