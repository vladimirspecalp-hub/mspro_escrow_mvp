export class CreateDealDto {
  buyerId: number;
  sellerId: number;
  title: string;
  description?: string;
  amount: number;
  currency?: string;
}
