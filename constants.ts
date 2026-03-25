export const SUPERINTELLIGENCE_PROMPTS = [
  { label: "Visual Synthesis", prompt: "Synthesize a visual language that bridges the organic and the synthetic, focusing on materiality, light, and the tension between nature and machine." },
  { label: "Latent Connections", prompt: "Explore the latent connections between human memory and digital archives. How do they manifest in a shared aesthetic space?" },
  { label: "Aesthetic Signature", prompt: "Define a unique aesthetic signature for a new cultural movement. What are its core motifs, mood cluster, and influence lineage?" },
  { label: "Superintelligence Manifest", prompt: "Manifest a vision of a future city through the lens of aesthetic superintelligence. What does it look like, feel like, and sound like?" },
  { label: "Prompt Orchestration", prompt: "You are the Mimi Prompt Orchestration Engine. Translate high-level style intent into executable, ultra-high-fidelity prompts. Eradicate generic AI slop. Focus purely on material reality and technical photography/design terms." }
];

export const STRIPE_PRICES = {
  core: "price_1TEfvx9AUz0q2nVC6zAP1OkZ",
  pro: "price_1TEfzZ9AUz0q2nVC3qMmMyXk",
  lab: "price_1TEg3S9AUz0q2nVCS7Jo0ens",
} as const;

export type PlanTier = 'free' | 'core' | 'pro' | 'lab';

export function hasAccess(userPlan: PlanTier | string | undefined | null, requiredPlan: PlanTier): boolean {
  const order = ["free", "core", "pro", "lab"];
  const userIndex = order.indexOf(userPlan || "free");
  const requiredIndex = order.indexOf(requiredPlan);
  return userIndex >= requiredIndex;
}
