import { Logger } from 'tslog';
import { Config, TezosConfig } from '../../configuration';
import Knex from 'knex';
import { BcdProvider, Operation, Operations } from '../../infrastructure/tezos/bcdProvider';
import { AppState } from '../state/AppState';
import { ERC20Unwrap, ERC721Unwrap } from '../../domain/ERCUnwrap';
import { ErcUnwrapDAO } from '../../dao/ErcUnwrapDAO';
import { Dependencies } from '../../bootstrap';

export class TezosInitialUnwrapIndexer {
  constructor({
                logger,
                tezosConfiguration,
                configuration,
                bcd,
                dbClient,
              }: Dependencies) {
    this._logger = logger;
    this._tezosConfiguration = tezosConfiguration;
    this._configuration = configuration;
    this._bcd = bcd;
    this._dbClient = dbClient;
    this._appState = new AppState(dbClient);
    this._unwrapDAO = new ErcUnwrapDAO(dbClient);
  }

  async index(): Promise<void> {
    const minLevelProcessed = await this._appState.getErcUnwrapMinLevelProcessed();
    this._logger.info(`Indexing tezos unwraps from level ${minLevelProcessed ? minLevelProcessed : 'none'}`);
    const operations = await this._getAllOperationsUntilLevel(minLevelProcessed);
    if (operations.length > 0) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._addOperations(operations, transaction);
        await this._appState.setErcUnwrapMinLevelProcessed(operations[0].level, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process tezos unwraps ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getAllOperationsUntilLevel(level: number): Promise<Operation[]> {
    const operations: Operation[] = [];
    let lastProcessedId = undefined;
    let inProgress = true;
    do {
      const currentOperations = await this._bcd
        .getContractOperations(
          this._tezosConfiguration.minterContractAddress,
          ['unwrap_erc20', 'unwrap_erc721'],
          lastProcessedId);
      if (currentOperations.operations.length === 0 || currentOperations.operations[currentOperations.operations.length-1].level < level) {
        inProgress = false;
      } else {
        lastProcessedId = currentOperations.last_id;
      }
      operations.push(...currentOperations.operations.filter(o => o.status == 'applied' && !o.mempool && o.level >= level));
    } while (inProgress);
    return operations;
  }

  private async _addOperations(operationsToProcess: Operation[], transaction: Knex.Transaction): Promise<void> {
    for (const operation of operationsToProcess) {
      let operationId = `${operation.hash}/${operation.counter}`;
      if (operation.internal) {
        // TODO get nonce of internal operation
        operationId += `/${0}`;
      }
      const unwrap = this._parseERCUnwrap(operation, operationId);
      if (unwrap) {
        const existingUnwrap = await this._unwrapDAO.isExist(unwrap, transaction);
        if (!existingUnwrap) {
          await this._unwrapDAO.save(unwrap, transaction);
        }
      }
    }
  }

  private _parseERCUnwrap(operation: Operation, operationId: string): ERC20Unwrap | ERC721Unwrap | null {
    if (operation.entrypoint === 'unwrap_erc20') {
      return {
        id: operation.id,
        source: operation.source,
        token: '0x' + operation.parameters[0].children.find(c => c.name == 'erc_20').value,
        amount: operation.parameters[0].children.find(c => c.name == 'amount').value as string,
        ethereumDestination: '0x' + (operation.parameters[0].children.find(c => c.name == 'destination').value as string).toLowerCase(),
        operationId,
        level: operation.level,
        status: 'asked',
      };
    } else if (operation.entrypoint === 'unwrap_erc721') {
      return {
        id: operation.id,
        source: operation.source,
        token: '0x' + operation.parameters[0].children.find(c => c.name == 'erc_721').value,
        tokenId: operation.parameters[0].children.find(c => c.name == 'token_id').value as string,
        ethereumDestination: '0x' + (operation.parameters[0].children.find(c => c.name == 'destination').value as string).toLowerCase(),
        operationId,
        level: operation.level,
        status: 'asked',
      };
    }
    return null;
  }


  private _logger: Logger;
  private _tezosConfiguration: TezosConfig;
  private _bcd: BcdProvider;
  private _dbClient: Knex;
  private _appState: AppState;
  private _configuration: Config;
  private _unwrapDAO: ErcUnwrapDAO;
}
