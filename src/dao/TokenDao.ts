import Knex from 'knex';
import { Token } from '../domain/Token';

export class TokenDao {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(token: Token, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('tokens')
      .transacting(transaction)
      .insert(token)
      .onConflict('ethereum_contract_address' as never)
      .merge(token);
  }

  async all(): Promise<Token[]> {
    return this._dbClient.table('tokens');
  }

  private _dbClient: Knex;
}