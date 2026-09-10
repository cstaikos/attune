import { ServiceError } from '../service-error';
/** Development/test controls, deliberately separate from the application's service contracts. */
export class MockControls {
 latencyMs = 120;
 private failures = new Map<string, ServiceError>();
 failNext(operation: string, error = new ServiceError('unavailable', 'Service temporarily unavailable.')): void {
  this.failures.set(operation, error);
 }
 async before(operation: string): Promise<void> {
  if (this.latencyMs > 0) await new Promise(resolve => setTimeout(resolve, this.latencyMs));
  const error = this.failures.get(operation);
  if (error) { this.failures.delete(operation); throw error; }
 }
}
