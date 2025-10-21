import { Injectable } from '@nestjs/common';

export interface KycVerificationResult {
  status: 'verified' | 'rejected';
  riskScore: number;
  reason?: string;
}

@Injectable()
export class MockKycProvider {
  /**
   * Mock KYC verification
   * Returns pseudo-random risk score and auto-approves if score < 50
   */
  async verifyDocument(
    documentType: string,
    documentNumber: string,
    fullName: string,
  ): Promise<KycVerificationResult> {
    // Simulate processing delay
    await this.delay(500);

    // Generate pseudo-random risk score based on document number
    const riskScore = this.calculateRiskScore(documentNumber);

    // Auto-approve if risk score < 50
    if (riskScore < 50) {
      return {
        status: 'verified',
        riskScore,
      };
    }

    return {
      status: 'rejected',
      riskScore,
      reason: 'High risk score detected',
    };
  }

  private calculateRiskScore(documentNumber: string): number {
    // Generate deterministic score from document number
    let hash = 0;
    for (let i = 0; i < documentNumber.length; i++) {
      hash = (hash << 5) - hash + documentNumber.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
